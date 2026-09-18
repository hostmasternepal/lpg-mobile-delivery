import { IsInt, Min } from 'class-validator';

/**
 * Manual, human-reported update to remaining stock — there is
 * deliberately NO automatic decrement on stop assignment or confirmation
 * (per-delivery cylinder consumption is OPEN-BUSINESS-DECISION-20/43;
 * this module tracks whatever the dispatcher reports, it does not
 * assume "1 stop = 1 cylinder" or any other unstated quantity rule).
 */
export class AdjustVehicleLoadDto {
  @IsInt()
  @Min(0)
  cylindersRemaining!: number;
}
