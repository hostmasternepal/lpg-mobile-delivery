import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface RecordAuditEntryInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
  correlationId?: string;
  ipAddress?: string;
}

export interface QueryAuditLogInput {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  limit?: number;
}

/**
 * Sole writer of audit_logs (docs/ARCHITECTURE.md §2 boundary rule 5 /
 * ARCH-DECISION-17). Every other module reaches this only indirectly, by
 * emitting a domain event this module's listener consumes — never by
 * importing this service or the Prisma model directly. That import
 * discipline is enforced by a CI lint rule (see backend/.dependency-cruiser.cjs),
 * not by a database grant, because a single pooled DB credential cannot
 * restrict write-identity at the Postgres grant level in this monolith.
 */
@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async record(input: RecordAuditEntryInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeState: (input.beforeState as any) ?? undefined,
        afterState: (input.afterState as any) ?? undefined,
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
      },
    });
  }

  /**
   * ARCH-DECISION-24: reading the audit log is itself a sensitive,
   * auditable action (it can expose another citizen's PII/history) —
   * every query self-reports via an event, consumed by this module's own
   * listener, closing docs/ARCHITECTURE_REVIEW.md K-2/MED-10.
   */
  async query(input: QueryAuditLogInput, requestedBy: string) {
    const results = await this.prisma.auditLog.findMany({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId,
      },
      orderBy: { createdAt: 'desc' },
      take: input.limit ?? 50,
    });

    this.events.emit('audit.log_queried', {
      actorId: requestedBy,
      filters: input,
      occurredAt: new Date(),
    });

    return results;
  }
}
