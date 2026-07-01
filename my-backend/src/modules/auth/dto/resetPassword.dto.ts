import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  email!: string;

  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @Length(6, 6)
  otp!: string;

  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(6)
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least one special character',
  })
  newPassword!: string;
}
