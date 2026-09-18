import { Module } from '@nestjs/common';
import { DashboardReportingService } from './dashboard-reporting.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§8, ARCHITECTURE_REVIEW.md
 * A-4/CRIT-6): read-model aggregation ONLY from its own projection tables
 * — never direct queries against RequestIntake/Verification/
 * PriorityClassification/DeliveryPlanning's operational tables. Those
 * projection tables (and the event subscribers that build them) are not
 * yet implemented; this module currently has no Prisma models of its own
 * for that reason — do not reach into `Request`/`DeliveryStop` from here
 * to make progress faster. See docs/ARCHITECTURE.md §2 boundary rule 4.
 * Scaffolded, not yet implemented.
 */
@Module({
  providers: [DashboardReportingService],
  exports: [DashboardReportingService],
})
export class DashboardReportingModule {}
