import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { VERIFICATION_METHODS, VERIFICATION_OUTCOMES, VerificationMethod, VerificationOutcomeCode } from '../verification.constants';

/**
 * REQ-019/022. `expectedVersion` is the request's current `version`
 * (from a prior GET /requests/:id) — required so a CONFIRMED outcome's
 * resulting call to RequestIntakeService.transition() can perform its
 * optimistic-concurrency check (ARCH-DECISION-14).
 *
 * There is deliberately no "REJECTED"/rejection-reason field here — no
 * source document defines a rejection path (OPEN-BUSINESS-DECISION-07).
 * A FAILED outcome is recorded as history only; it does not move
 * requests.status anywhere.
 */
export class RecordVerificationDto {
  @IsIn(VERIFICATION_METHODS)
  method!: VerificationMethod;

  @IsIn(VERIFICATION_OUTCOMES)
  outcome!: VerificationOutcomeCode;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  @Min(0)
  expectedVersion!: number;
}
