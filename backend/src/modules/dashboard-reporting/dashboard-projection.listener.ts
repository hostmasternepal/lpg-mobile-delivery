import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';

interface RequestSnapshot {
  id: string;
  status: string;
  sourceChannel: string;
  createdAt: string | Date;
  beneficiary?: { location?: unknown } | null;
}

/**
 * Builds and maintains dashboard_request_projections purely by reacting
 * to domain events already emitted by RequestIntake, PriorityClassification,
 * and DeliveryPlanning — this is the ONLY way DashboardReporting's data
 * gets populated (docs/ARCHITECTURE.md §2 boundary rule 4). It never
 * calls into those modules' services or reads their tables.
 *
 * `updateMany` (not `update`) is used throughout: if a projection row
 * doesn't yet exist when an update-type event arrives (e.g. event
 * ordering during a cold start, or a row that predates this feature and
 * hasn't been backfilled — see backend/scripts/backfill-dashboard-
 * projections.ts), this listener degrades to a silent no-op rather than
 * throwing and disrupting the module that emitted the event.
 */
@Injectable()
export class DashboardProjectionListener {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('request.created')
  async onRequestCreated(payload: { requestId: string; afterState: RequestSnapshot; occurredAt: Date }) {
    const req = payload.afterState;
    await this.prisma.dashboardRequestProjection.upsert({
      where: { requestId: payload.requestId },
      update: {
        status: req.status,
        sourceChannel: req.sourceChannel,
        district: this.extractDistrict(req),
      },
      create: {
        requestId: payload.requestId,
        status: req.status,
        sourceChannel: req.sourceChannel,
        district: this.extractDistrict(req),
        createdAt: new Date(req.createdAt),
      },
    });
  }

  @OnEvent('request.updated')
  async onRequestUpdated(payload: { requestId: string; afterState: RequestSnapshot; occurredAt: Date }) {
    await this.prisma.dashboardRequestProjection.updateMany({
      where: { requestId: payload.requestId },
      data: { district: this.extractDistrict(payload.afterState) },
    });
  }

  @OnEvent('request.status_changed')
  async onRequestStatusChanged(payload: { requestId: string; toStatus: string; occurredAt: Date }) {
    await this.prisma.dashboardRequestProjection.updateMany({
      where: { requestId: payload.requestId },
      data: { status: payload.toStatus },
    });
  }

  @OnEvent('priority.assessed')
  async onPriorityAssessed(payload: { requestId: string; afterState: unknown[]; occurredAt: Date }) {
    await this.setHasPriorityGroup(payload.requestId, payload.afterState);
  }

  @OnEvent('priority.overridden')
  async onPriorityOverridden(payload: { requestId: string; afterState: unknown[]; occurredAt: Date }) {
    await this.setHasPriorityGroup(payload.requestId, payload.afterState);
  }

  @OnEvent('delivery.confirmed')
  async onDeliveryConfirmed(payload: { requestId: string; occurredAt: Date }) {
    await this.markDelivered(payload.requestId, payload.occurredAt);
  }

  @OnEvent('delivery.manual_override_confirmed')
  async onManualOverrideConfirmed(payload: { requestId: string; occurredAt: Date }) {
    await this.markDelivered(payload.requestId, payload.occurredAt);
  }

  private async setHasPriorityGroup(requestId: string, groups: unknown[]): Promise<void> {
    await this.prisma.dashboardRequestProjection.updateMany({
      where: { requestId },
      data: { hasPriorityGroup: Array.isArray(groups) && groups.length > 0 },
    });
  }

  private async markDelivered(requestId: string, occurredAt: Date): Promise<void> {
    await this.prisma.dashboardRequestProjection.updateMany({
      where: { requestId },
      data: { deliveredAt: occurredAt },
    });
  }

  private extractDistrict(req: RequestSnapshot): string | undefined {
    const location = req.beneficiary?.location as { district?: string } | null | undefined;
    return location?.district ?? undefined;
  }
}
