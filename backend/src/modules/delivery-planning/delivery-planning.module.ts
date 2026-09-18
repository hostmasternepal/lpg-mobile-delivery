import { Module } from '@nestjs/common';
import { RequestIntakeModule } from '../request-intake/request-intake.module';
import { DeliveryPlanningController } from './delivery-planning.controller';
import { DeliveryPlanningService } from './delivery-planning.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§7, ARCHITECTURE_REVIEW.md §D):
 * plan/vehicle/stop/route management and queue ordering. Owns
 * delivery_plans, delivery_plan_vehicles, vehicles, delivery_stops,
 * deliveries, agent_profile.
 *
 * recordOtpOutcome() is the ONLY method that may set
 * delivery_stops.status = CONFIRMED (ARCH-DECISION-19) — the (not yet
 * built) Otp module will call it rather than writing the column itself.
 * generatePlan() runs in a single transaction and is idempotent per
 * plan_date (ARCH-DECISION-15, closes review HIGH-6); assignStop() is
 * idempotent per request (a request can only be assigned once — see the
 * DELIVERY_QUEUE precondition) and atomic with the request's status
 * transition via a shared Prisma transaction.
 */
@Module({
  imports: [RequestIntakeModule],
  controllers: [DeliveryPlanningController],
  providers: [DeliveryPlanningService],
  exports: [DeliveryPlanningService],
})
export class DeliveryPlanningModule {}
