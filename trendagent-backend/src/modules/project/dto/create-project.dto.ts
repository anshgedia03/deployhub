import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @Transform(({ value }: { value: string }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(3, {
    message: 'Project name must be at least 3 characters long',
  })
  @MaxLength(30, {
    message: 'Project name cannot exceed 30 characters',
  })
  name!: string;
}
