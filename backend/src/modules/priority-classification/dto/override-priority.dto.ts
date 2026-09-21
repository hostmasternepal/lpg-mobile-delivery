import { IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { PRIORITY_GROUP_CODES, PriorityGroupCode } from '../priority-classification.constants';

/**
 * A human correcting a prior/automated classification — distinct from
 * assess()'s additive tagging: this REPLACES the group set outright.
 * `reason` is mandatory (docs/ARCHITECTURE_REVIEW.md §C, closes HIGH-8).
 * Who is authorized to call this is OPEN-BUSINESS-DECISION-39 — gated for
 * now under the same `request:classify-priority` permission as assess(),
 * pending that ratification.
 */
export class OverridePriorityDto {
  @IsArray()
  @IsIn(PRIORITY_GROUP_CODES, { each: true })
  newGroupCodes!: PriorityGroupCode[];

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
