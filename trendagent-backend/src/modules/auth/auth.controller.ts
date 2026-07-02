import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/createUser.dto';
import { SignInDto } from './dto/signIn.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleUserProfile } from './interface/auth.interface';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from 'src/common/interfaces';

interface GoogleAuthRequest extends Request {
  user?: GoogleUserProfile;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
};

@Controller('auth')
@Throttle({
  default: {
    limit: 20,
    ttl: 30000,
  },
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('sign-up')
  signUp(@Body() dto: CreateUserDto) {
    return this.authService.signUp(dto); // no tokens yet — must verify email first
  }
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.verifyEmail(dto);

    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      message: 'Email verified successfully',
      user,
    };
  }
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.signIn(dto);
    this.setTokenCookies(
      res,
      tokens.accessToken,
      tokens.refreshToken,
      dto.rememberMe,
    );
    return { message: 'Signed in successfully', user };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  /*
  |--------------------------------------------------------------------------
  | GOOGLE OAUTH CALLBACK
  |--------------------------------------------------------------------------
  | Google redirects the user back here after consent. From this point,
  | the backend decides whether to send OTP for verification or sign the
  | user in immediately with the normal auth cookies.
  |--------------------------------------------------------------------------
  */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: GoogleAuthRequest,
    @Res() res: Response,
  ) {
    if (!req.user) {
      return res.status(401).json({ message: 'Google authentication failed' });
    }

    const result = await this.authService.handleGoogleAuth(req.user);

    if (result.tokens) {
      this.setTokenCookies(
        res,
        result.tokens.accessToken,
        result.tokens.refreshToken,
      );
    }

    if (result.status === 'verification_required') {
      return res.redirect(
        this.buildFrontendUrl('/en/auth/verify-email', {
          email: result.email,
        }),
      );
    }

    return res.redirect(this.buildFrontendUrl('/en/home'));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) throw new Error('User not authenticated');
    await this.authService.logout(req.user.sub);
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken)
      return res.status(401).json({ message: 'No refresh token' });

    const user = await this.authService.verifyRefreshToken(refreshToken);

    const tokens = await this.authService.refreshTokens(user.id, refreshToken);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Tokens refreshed' };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    rememberMe = false,
  ) {
    const refreshMaxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge,
    });
  }

  private buildFrontendUrl(
    path: string,
    query: Record<string, string> = {},
  ): string {
    const base =
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:4000/';
    const url = new URL(path, base.endsWith('/') ? base : `${base}/`);

    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }
}
