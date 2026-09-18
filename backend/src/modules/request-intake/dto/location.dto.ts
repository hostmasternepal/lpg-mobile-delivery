import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * {district, municipality, ward, lat, lng} shape referenced by
 * docs/ARCHITECTURE.md §4 (beneficiaries.location JSONB). The taxonomy
 * itself (standard district/ward codes) is OPEN-BUSINESS-DECISION-01 —
 * these fields are free-text/number placeholders until that's ratified,
 * not a resolution of it.
 */
export class LocationDto {
  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
