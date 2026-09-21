import { IsInt, Min } from 'class-validator';

/** Shared shape for request-status-transition actions (shortlist/queue). */
export class ExpectedVersionDto {
  @IsInt()
  @Min(0)
  expectedVersion!: number;
}
