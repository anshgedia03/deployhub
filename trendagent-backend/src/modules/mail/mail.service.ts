import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpVerification(email: string, name: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email',
      template: './otp',
      context: { name, otp, expiresIn: '10 minutes' },
    });
  }

  async sendForgotPasswordOtp(email: string, name: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password',
      template: './forgot-password',
      context: { name, otp, expiresIn: '10 minutes' },
    });
  }
}
