import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LocationDto } from './location.dto';
import { SOURCE_CHANNELS, SourceChannel } from '../request-intake.constants';

/**
 * REQ-016/017/018: every beneficiary field is optional ("सम्भव भएसम्म" —
 * where possible), only sourceChannel is mandatory (a request must know
 * where it came from). Do not make any beneficiary field required here —
 * that would silently narrow REQ-018's explicit partial-data allowance.
 */
export class CreateRequestDto {
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

  @IsIn(SOURCE_CHANNELS)
  sourceChannel!: SourceChannel;

  @IsOptional()
  @IsDateString()
  requestedAt?: string;
}
