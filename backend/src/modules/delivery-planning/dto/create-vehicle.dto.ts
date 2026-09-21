import { IsInt, IsOptional, IsString, MinLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  identifier!: string;

  /**
   * Physical cylinder capacity of this vehicle. Nullable/optional: the
   * fleet's actual capacity figures are OPEN-BUSINESS-DECISION-10, not
   * something this module invents — omit it if unknown and set it later.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  capacityCylinders?: number;
}
