import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RenameChatDto {
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(3, {
    message: 'ChatSession name must be at least 3 characters long',
  })
  @MaxLength(30, {
    message: 'ChatSession name cannot exceed 30 characters',
  })
  title!: string;
}
