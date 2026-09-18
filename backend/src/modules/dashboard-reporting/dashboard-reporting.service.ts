import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface DailyDistributionRow {
  date: Date;
  count: number;
}

/**
 * REQ-029's 11 dashboard metrics. Every query here reads ONLY
 * dashboard_request_projections — never requests/deliveries/
 * verifications/etc. directly (docs/ARCHITECTURE.md §2 boundary rule 4,
 * closing review A-4/CRIT-6).
 *
 * Metric semantics not defined by the SRS (REQ-029 names the metrics but
 * not their exact counting rule) are interpreted as a literal CURRENT
 * snapshot count per status — e.g. "Verified Requests" is not defined
 * as "count(*) where status != 'RECORDED')". This is stated
 * explicitly here rather than silently assumed, since a cumulative
 * "reached this stage or later" reading is equally plausible and the
 * source document doesn't say which. Both readings are one query away
 * from each other if MoICS/NOC clarifies.
 */
@Injectable()
export class DashboardReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [total, verifiedOrLater, priority, shortlisted, planned, inProgress, delivered, pendingRejected, bySource] =
      await Promise.all([
        this.prisma.dashboardRequestProjection.count(),
        this.prisma.dashboardRequestProjection.count({ where: { status: { not: 'RECORDED' } } }),
        this.prisma.dashboardRequestProjection.count({ where: { hasPriorityGroup: true } }),
        this.prisma.dashboardRequestProjection.count({ where: { status: 'SHORTLISTED' } }),
        this.prisma.dashboardRequestProjection.count({ where: { status: 'DELIVERY_PLANNED' } }),
        this.prisma.dashboardRequestProjection.count({ where: { status: 'DELIVERY_IN_PROGRESS' } }),
        this.prisma.dashboardRequestProjection.count({ where: { status: 'DELIVERED' } }),
        this.prisma.dashboardRequestProjection.count({ where: { status: { in: ['PENDING', 'REJECTED'] } } }),
        this.prisma.dashboardRequestProjection.groupBy({ by: ['sourceChannel'], _count: { _all: true } }),
      ]);

    return {
      totalRequests: total,
      verifiedRequests: verifiedOrLater,
      priorityRequests: priority,
      shortlistedRequests: shortlisted,
      deliveryPlanned: planned,
      deliveryInProgress: inProgress,
      delivered,
      pendingOrRejected: pendingRejected,
      sourceBreakdown: bySource.map((row) => ({ sourceChannel: row.sourceChannel, count: row._count._all })),
    };
  }

  async getDistrictDemand() {
    const rows = await this.prisma.dashboardRequestProjection.groupBy({
      by: ['district'],
      _count: { _all: true },
    });
    return rows
      .map((row) => ({ district: row.district ?? 'UNKNOWN', count: row._count._all }))
      .sort((a, b) => b.count - a.count);
  }

  async getDailyDistribution() {
    return this.prisma.$queryRaw<DailyDistributionRow[]>`
      SELECT date_trunc('day', delivered_at) AS date, count(*)::int AS count
      FROM dashboard_request_projections
      WHERE delivered_at IS NOT NULL
      GROUP BY 1
      ORDER BY 1 DESC
    `;
  }
}
