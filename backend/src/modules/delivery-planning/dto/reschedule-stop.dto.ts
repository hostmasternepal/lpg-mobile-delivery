import { IsUUID } from 'class-validator';

/**
 * ARCH-DECISION-07: creates a NEW delivery_stops row (attemptNumber + 1)
 * rather than reopening the failed one. The dispatcher explicitly picks
 * the plan/vehicle for the retry (which day, which run) — same-day vs.
 * next-day reschedule policy is OPEN-BUSINESS-DECISION-41, so this
 * module does not decide it automatically.
 */
export class RescheduleStopDto {
  @IsUUID()
  deliveryPlanVehicleId!: string;
}
