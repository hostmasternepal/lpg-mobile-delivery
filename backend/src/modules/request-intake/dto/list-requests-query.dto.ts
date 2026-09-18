import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { REQUEST_STATUSES, RequestStatus } from '../request-state-machine';
import { SOURCE_CHANNELS, SourceChannel } from '../request-intake.constants';

export class ListRequestsQueryDto {
  @IsOptional()
  @IsIn(REQUEST_STATUSES)
  status?: RequestStatus;

  @IsOptional()
  @IsIn(SOURCE_CHANNELS)
  sourceChannel?: SourceChannel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
