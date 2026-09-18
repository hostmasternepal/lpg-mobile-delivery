import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class DispatchToDistributorDto {
  @IsUUID()
  planId!: string;

  @IsString()
  vehicleIdentifier!: string;

  @IsInt()
  @Min(0)
  stopCount!: number;
}
