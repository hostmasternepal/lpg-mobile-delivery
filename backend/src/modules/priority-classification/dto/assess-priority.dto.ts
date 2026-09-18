import { IsArray, IsIn, IsOptional } from 'class-validator';
import { PRIORITY_GROUP_CODES, PriorityGroupCode } from '../priority-classification.constants';

/**
 * REQ-023. `manualGroupCodes` is the fallback path described in
 * docs/ARCHITECTURE_REVIEW.md §C: when no rule matches (today, ALWAYS —
 * no rules are ratified yet, OPEN-BUSINESS-DECISION-08), a
 * VERIFICATION_OFFICER supplies the group(s) directly rather than the
 * system inventing a match. Manually-supplied groups are unioned with
 * whatever the rule engine matched, never treated as mutually exclusive.
 */
export class AssessPriorityDto {
  @IsOptional()
  @IsArray()
  @IsIn(PRIORITY_GROUP_CODES, { each: true })
  manualGroupCodes?: PriorityGroupCode[];
}
