import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAgentProfileDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  licenseRef?: string;
}
