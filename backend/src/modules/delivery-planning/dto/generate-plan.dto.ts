import { IsDateString } from 'class-validator';

export class GeneratePlanDto {
  /** Date only (e.g. "2026-09-18") — REQ-024's "daily/as-needed" plan. */
  @IsDateString()
  planDate!: string;
}
