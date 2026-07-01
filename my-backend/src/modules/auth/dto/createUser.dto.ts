import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @Matches(/^[a-zA-Z\s]*$/, { message: 'Name must contain only letters' })
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character',
  })
  password!: string;
}
