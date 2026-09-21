import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LocationDto } from '../../request-intake/dto/location.dto';

/**
 * Identical field set to CreateRequestDto minus `sourceChannel` — the
 * route (`/integrations/:sourceChannel/webhook`) already determines
 * that. Field names here are OUR contract, not any external system's —
 * see request-source-adapter.ts for why.
 */
export class InboundRequestPayloadDto {
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

  @IsOptional()
  @IsDateString()
  requestedAt?: string;
}

/**
 * ARCH-DECISION-13: `externalReferenceId` is the idempotency key,
 * combined with the route's sourceChannel. Required — a source with no
 * stable reference id cannot use this endpoint; it goes through the
 * manual-entry path in the RequestIntake UI instead (docs/
 * ARCHITECTURE.md §11).
 */
export class ReceiveWebhookDto {
  @IsString()
  @IsNotEmpty()
  externalReferenceId!: string;

  @ValidateNested()
  @Type(() => InboundRequestPayloadDto)
  payload!: InboundRequestPayloadDto;
}
