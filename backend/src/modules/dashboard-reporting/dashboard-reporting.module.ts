import { Module } from '@nestjs/common';
import { DashboardProjectionListener } from './dashboard-projection.listener';
import { DashboardReportingController } from './dashboard-reporting.controller';
import { DashboardReportingService } from './dashboard-reporting.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§8, ARCHITECTURE_REVIEW.md
 * A-4/CRIT-6): read-model aggregation ONLY from its own
 * dashboard_request_projections table — never direct queries against
 * RequestIntake/PriorityClassification/DeliveryPlanning's operational
 * tables. DashboardProjectionListener is the sole writer of that table,
 * populated purely by reacting to domain events; DashboardReportingService
 * only ever reads it. See docs/ARCHITECTURE.md §2 boundary rule 4.
 *
 * A pre-existing system's historical data is NOT backfilled by this
 * module at runtime (that would require reading Request/Delivery
 * directly, violating the rule above) — see the standalone,
 * intentionally-outside-the-module-boundary script
 * backend/scripts/backfill-dashboard-projections.ts for one-time/ops use.
 */
@Module({
  controllers: [DashboardReportingController],
  providers: [DashboardReportingService, DashboardProjectionListener],
  exports: [DashboardReportingService],
})
export class DashboardReportingModule {}
