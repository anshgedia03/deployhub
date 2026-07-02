import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthHelperService {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(
    userId: string,
    email: string,
    name: string,
    type: 'verify' | 'reset',
  ) {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Using 8 rounds is plenty for a 6-digit short-lived OTP and faster than 10
    const hashedOtp = await bcrypt.hash(otp, 8);

    await this.userService.saveOtp(userId, hashedOtp, expiresAt);

    // Fire and forget the email sending to keep the API response fast
    const mailPromise =
      type === 'verify'
        ? this.mailService.sendOtpVerification(email, name, otp)
        : this.mailService.sendForgotPasswordOtp(email, name, otp);

    mailPromise.catch((err) => {
      console.error(`Failed to send ${type} OTP email to ${email}:`, err);
    });
  }

  async validateOtp(user: any, plainOtp: string) {
    if (!user.otp) throw new BadRequestException('No OTP requested');
    if (new Date() > user.otpExpiresAt)
      throw new BadRequestException('OTP has expired');

    const otpMatch = await bcrypt.compare(plainOtp, user.otp);
    if (!otpMatch) throw new BadRequestException('Invalid OTP');
  }
}
