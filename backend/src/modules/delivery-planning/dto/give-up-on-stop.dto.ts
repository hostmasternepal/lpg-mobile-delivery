import { IsString, MinLength } from 'class-validator';

/** Mandatory reason — this is a terminal, audited dispatch decision. */
export class GiveUpOnStopDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}
