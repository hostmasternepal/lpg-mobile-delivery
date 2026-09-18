import { Module } from '@nestjs/common';
import { DeliveryPlanningService } from './delivery-planning.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§7, ARCHITECTURE_REVIEW.md §D):
 * plan/vehicle/stop/route management and queue ordering. Owns
 * delivery_plans, delivery_plan_vehicles, vehicles, delivery_stops,
 * deliveries, agent_profile.
 *
 * recordOtpOutcome() is the ONLY method that may set
 * delivery_stops.status = CONFIRMED (ARCH-DECISION-19) — the Otp module
 * calls it rather than writing the column itself. generatePlan() must run
 * in a single transaction and be idempotent per (plan_date, request_id,
 * attempt_number) — ARCH-DECISION-15, closes review HIGH-6.
 * Scaffolded, not yet implemented.
 */
@Module({
  providers: [DeliveryPlanningService],
  exports: [DeliveryPlanningService],
})
export class DeliveryPlanningModule {}
