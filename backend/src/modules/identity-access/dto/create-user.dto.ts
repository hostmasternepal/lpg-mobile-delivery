import { ArrayMinSize, IsArray, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(1)
  phoneOrUsername!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleNames!: string[];
}
