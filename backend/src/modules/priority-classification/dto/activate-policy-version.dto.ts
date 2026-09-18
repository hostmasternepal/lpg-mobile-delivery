import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * `scoringFormula` stays optional/nullable by design (REQ-023,
 * OPEN-BUSINESS-DECISION-08) — omit it entirely until MoICS/NOC ratifies
 * an actual formula. This endpoint does not validate the formula's
 * *content*, only that it's a JSON object if supplied; the meaning of
 * any formula is out of this module's authority to decide.
 */
export class ActivatePolicyVersionDto {
  @IsString()
  @MinLength(1)
  versionLabel!: string;

  @IsOptional()
  @IsObject()
  scoringFormula?: Record<string, unknown>;
}
