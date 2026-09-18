import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SOURCE_CHANNELS } from '../request-intake/request-intake.constants';
import { RequestIntakeService } from '../request-intake/request-intake.service';
import {
  DistributorDispatchPayload,
  IDeliveryDispatchAdapter,
  NoopDeliveryDispatchAdapter,
} from './delivery-dispatch-adapter';
import { InboundRequestPayloadDto } from './dto/receive-webhook.dto';
import { GenericPassthroughAdapter, IRequestSourceAdapter } from './request-source-adapter';

@Injectable()
export class ExternalIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestIntake: RequestIntakeService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * ARCH-DECISION-13: stage-then-process, closing review CRIT-5 (no
   * idempotency existed pre-review). The staging insert's UNIQUE
   * constraint on (sourceChannel, externalReferenceId) is what makes a
   * replayed webhook a detected no-op instead of a duplicate request —
   * this is enforced by the database, not a pre-check-then-insert (which
   * would itself be a TOCTOU race under concurrent retries).
   */
  async receiveWebhook(sourceChannel: string, externalReferenceId: string, payload: InboundRequestPayloadDto, actorId: string) {
    if (!SOURCE_CHANNELS.includes(sourceChannel as (typeof SOURCE_CHANNELS)[number])) {
      throw new BadRequestException(`Unknown source channel '${sourceChannel}'.`);
    }

    let inboxEntry;
    try {
      inboxEntry = await this.prisma.integrationInboxEntry.create({
        data: {
          sourceChannel,
          externalReferenceId,
          rawPayload: payload as unknown as Prisma.InputJsonValue,
          status: 'RECEIVED',
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await this.prisma.integrationInboxEntry.findUniqueOrThrow({
          where: { sourceChannel_externalReferenceId: { sourceChannel, externalReferenceId } },
        });
        await this.prisma.integrationInboxEntry.update({ where: { id: existing.id }, data: { status: 'DUPLICATE' } });
        this.events.emit('integration.inbound_duplicate', {
          inboxEntryId: existing.id,
          sourceChannel,
          externalReferenceId,
          occurredAt: new Date(),
        });
        return {
          status: 'DUPLICATE' as const,
          inboxEntryId: existing.id,
          resultingRequestId: existing.resultingRequestId,
        };
      }
      throw err;
    }

    this.events.emit('integration.inbound_received', {
      inboxEntryId: inboxEntry.id,
      sourceChannel,
      externalReferenceId,
      occurredAt: new Date(),
    });

    try {
      const adapter = this.getAdapterFor(sourceChannel);
      const normalized = adapter.normalize(sourceChannel, payload);
      const created = await this.requestIntake.createRequest(normalized, actorId);

      await this.prisma.integrationInboxEntry.update({
        where: { id: inboxEntry.id },
        data: { status: 'PROCESSED', processedAt: new Date(), resultingRequestId: created.id },
      });

      this.events.emit('integration.inbound_processed', {
        inboxEntryId: inboxEntry.id,
        requestId: created.id,
        occurredAt: new Date(),
      });

      return { status: 'PROCESSED' as const, inboxEntryId: inboxEntry.id, resultingRequestId: created.id, request: created };
    } catch (err) {
      // Closes review F-2/I-9: the raw payload is already durably staged
      // (inserted above) before this point, so a failure here leaves a
      // FAILED row that reprocessInboxEntry() can retry — it does not
      // depend on the external source retrying reliably, which no
      // source document guarantees any of them will do.
      await this.prisma.integrationInboxEntry.update({ where: { id: inboxEntry.id }, data: { status: 'FAILED' } });
      this.events.emit('integration.inbound_failed', {
        inboxEntryId: inboxEntry.id,
        sourceChannel,
        externalReferenceId,
        error: err instanceof Error ? err.message : String(err),
        occurredAt: new Date(),
      });
      throw err;
    }
  }

  /** Manual retry for a FAILED inbox entry — the operational recovery path F-2 describes. */
  async reprocessInboxEntry(inboxEntryId: string, actorId: string) {
    const entry = await this.prisma.integrationInboxEntry.findUnique({ where: { id: inboxEntryId } });
    if (!entry) {
      throw new NotFoundException(`Integration inbox entry ${inboxEntryId} not found.`);
    }
    if (entry.status !== 'FAILED') {
      throw new BadRequestException(`Inbox entry ${inboxEntryId} is ${entry.status}; only FAILED entries can be reprocessed.`);
    }

    const adapter = this.getAdapterFor(entry.sourceChannel);
    const normalized = adapter.normalize(entry.sourceChannel, entry.rawPayload as InboundRequestPayloadDto);
    const created = await this.requestIntake.createRequest(normalized, actorId);

    await this.prisma.integrationInboxEntry.update({
      where: { id: entry.id },
      data: { status: 'PROCESSED', processedAt: new Date(), resultingRequestId: created.id },
    });

    this.events.emit('integration.inbound_processed', {
      inboxEntryId: entry.id,
      requestId: created.id,
      occurredAt: new Date(),
    });

    return { status: 'PROCESSED' as const, inboxEntryId: entry.id, resultingRequestId: created.id, request: created };
  }

  async listInboxEntries(status?: string) {
    return this.prisma.integrationInboxEntry.findMany({
      where: status ? { status } : undefined,
      orderBy: { receivedAt: 'desc' },
    });
  }

  async getInboxEntry(id: string) {
    const entry = await this.prisma.integrationInboxEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Integration inbox entry ${id} not found.`);
    }
    return entry;
  }

  /**
   * Every source currently uses the same generic adapter — none has a
   * confirmed distinct contract yet (OPEN-BUSINESS-DECISION-21/22/27/28).
   * Swapping in a real one later means adding a `case` here; the
   * staging/idempotency pipeline above does not change.
   */
  private getAdapterFor(_sourceChannel: string): IRequestSourceAdapter {
    return new GenericPassthroughAdapter();
  }

  async dispatchToDistributor(payload: DistributorDispatchPayload, actorId: string) {
    const adapter = this.getDispatchAdapter();
    try {
      await adapter.dispatch(payload);
      this.events.emit('integration.outbound_dispatched', { ...payload, actorId, occurredAt: new Date() });
      return { status: 'DISPATCHED' as const };
    } catch (err) {
      this.events.emit('integration.outbound_dispatch_failed', {
        ...payload,
        actorId,
        error: err instanceof Error ? err.message : String(err),
        occurredAt: new Date(),
      });
      throw err;
    }
  }

  private getDispatchAdapter(): IDeliveryDispatchAdapter {
    return new NoopDeliveryDispatchAdapter();
  }
}
