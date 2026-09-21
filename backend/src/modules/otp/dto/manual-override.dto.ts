import { IsNotEmpty, IsString } from 'class-validator';

/** Mandatory reason — OPEN-BUSINESS-DECISION-40 governs who may submit this, not what it contains. */
export class ManualOverrideDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
