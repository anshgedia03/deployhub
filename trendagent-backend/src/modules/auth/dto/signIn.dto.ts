import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsString } from 'class-validator';

export class SignInDto {
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  email!: string;

  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  password!: string;

  @IsBoolean()
  rememberMe!: boolean;
}
