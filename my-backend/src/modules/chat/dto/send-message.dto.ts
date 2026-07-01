import { IsString, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  text?: string;

  // Transform ensures even a single ID string becomes an array [ 'id' ]
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachedFileIds?: string[];
}
