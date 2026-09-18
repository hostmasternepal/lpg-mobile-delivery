import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/**
 * Manual reordering only (docs/ARCHITECTURE_REVIEW.md §D / B-2): no route
 * optimization algorithm is implemented. `orderedStopIds` is the full
 * desired sequence, position 0 = first stop; all ids must already belong
 * to the target delivery_plan_vehicle.
 */
export class SequenceStopsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  orderedStopIds!: string[];
}
