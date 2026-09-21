import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { LocationDto } from './location.dto';

/**
 * Field-level edits only (REQ-018). Status is deliberately absent —
 * transitions go exclusively through RequestIntakeService.transition(),
 * called by the owning module (Verification, DeliveryPlanning, ...), never
 * through this generic update path (ARCH-DECISION-18).
 */
export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsString()
  lpgNeedDescription?: string;

  @IsOptional()
  @IsString()
  familyGroupStatus?: string;
}
