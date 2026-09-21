import { IsUUID } from 'class-validator';

export class AssignStopDto {
  @IsUUID()
  requestId!: string;
}
