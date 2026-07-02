import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  email!: string;

  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @Length(6, 6)
  otp!: string;
}
