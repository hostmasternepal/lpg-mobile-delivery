import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AssignVehicleDto {
  @IsUUID()
  vehicleId!: string;

  @IsOptional()
  @IsUUID()
  agentProfileId?: string;

  /**
   * How many cylinders are physically loaded for this run. Required and
   * human-supplied every time — the per-beneficiary/per-run QUANTITY
   * policy is OPEN-BUSINESS-DECISION-20/43; this module only tracks
   * whatever number the dispatcher reports, it does not compute one.
   */
  @IsInt()
  @Min(0)
  cylindersLoaded!: number;
}
