import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';
import { AuthHelperService } from './auth-helper.service';
import { CreateUserDto } from './dto/createUser.dto';
import { SignInDto } from './dto/signIn.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import {
  AuthResponse,
  GoogleUserProfile,
  Tokens,
} from './interface/auth.interface';
import { UserDocument } from '../user/schemas/user.schema';

type NullableUser = UserDocument | null;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly helper: AuthHelperService,
  ) {}

  async signUp(dto: CreateUserDto): Promise<{ message: string }> {
    const existing: NullableUser = await this.userService.findByEmail(
      dto.email,
    );
    if (existing !== null) throw new ConflictException('Email already in use');

    const hashedPassword = await this.tokenService.hashData(dto.password);
    const user = await this.userService.create({
      ...dto,
      email: dto.email,
      password: hashedPassword,
      isVerified: false,
    });

    await this.helper.sendOtp(user.id, user.email, user.name, 'verify');
    return { message: 'Account created. Check your email for the OTP.' };
  }

  async verifyEmail(dto: VerifyOtpDto): Promise<AuthResponse> {
    const user: NullableUser = await this.userService.findByEmail(dto.email);

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.helper.validateOtp(user, dto.otp);

    await this.userService.markVerified(user.id);

    const tokens = await this.handleTokenGeneration(user.id, user.email);

    return {
      tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
        provider: user.provider,
        googleId: user.googleId,
      },
    };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const user: NullableUser = await this.userService.findByEmail(email);
    if (user === null)
      throw new BadRequestException('User not found with this email');

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified.please sign in');
    }
    await this.helper.sendOtp(user.id, user.email, user.name, 'verify');
    return { message: 'OTP resent successfully' };
  }

  async signIn(dto: SignInDto): Promise<AuthResponse> {
    const user: NullableUser = await this.userService.findByEmail(dto.email);

    if (user === null) throw new UnauthorizedException('Invalid credentials');

    if (user.password === null)
      throw new UnauthorizedException('Use Google sign-in for this account');

    const isMatch = await this.tokenService.compareData(
      dto.password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new ForbiddenException('Please verify email');
    const tokens = await this.handleTokenGeneration(
      user.id,
      user.email,
      dto.rememberMe,
    );
    return {
      tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        provider: user.provider,
        googleId: user.googleId,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user: NullableUser = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("This email doesn't exits");
    }

    if (user !== null)
      await this.helper.sendOtp(user.id, user.email, user.name, 'reset');
    return { message: 'OTP has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user: NullableUser = await this.userService.findByEmail(dto.email);
    if (user === null) throw new NotFoundException('User not found');

    await this.helper.validateOtp(user, dto.otp);
    const hashed = await this.tokenService.hashData(dto.newPassword);

    await this.userService.updatePassword(user.id, hashed);
    await this.userService.clearOtp(user.id);
    return { message: 'Password reset successfully' };
  }

  async logout(userId: string): Promise<void> {
    await this.userService.updateRefreshToken(userId, null);
  }

  async verifyRefreshToken(token: string): Promise<UserDocument> {
    const payload = await this.tokenService.verifyRefreshToken(token);
    if (!payload?.sub) throw new UnauthorizedException('Invalid token payload');

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('User not found or already logged out');

    return user;
  }

  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const user: NullableUser = await this.userService.findById(userId);
    if (user === null || user.refreshToken === null)
      throw new ForbiddenException('Access denied');

    const match = await this.tokenService.compareData(rt, user.refreshToken);
    if (!match) throw new ForbiddenException('Access denied');

    return this.handleTokenGeneration(user.id, user.email);
  }

  async handleGoogleAuth(profile: GoogleUserProfile): Promise<{
    status: 'verification_required' | 'signed_in';
    email: string;
    message: string;
    tokens?: Tokens;
  }> {
    const existingUser = await this.userService.findByEmail(profile.email);

    /*
      |--------------------------------------------------------------------------
      | FIRST-TIME LOGIN USING GOOGLE ACCOUNT
      |--------------------------------------------------------------------------
      | New Google users are created as unverified accounts so they still go
      | through the existing OTP verification flow before activation.
      |--------------------------------------------------------------------------
      */
    if (existingUser === null) {
      const user = await this.userService.create({
        name: profile.name,
        email: profile.email,
        password: null,
        provider: 'google',
        googleId: profile.googleId,
        isVerified: false,
      });

      await this.helper.sendOtp(user.id, user.email, user.name, 'verify');

      return {
        status: 'verification_required',
        email: user.email,
        message: 'Please verify the OTP sent to your email.',
      };
    }

    /*
      |--------------------------------------------------------------------------
      | GOOGLE ACCOUNT LINKING
      |--------------------------------------------------------------------------
      | If a user already exists with the same email, attach the Google ID so
      | future Google sign-ins resolve to the same application account.
      |--------------------------------------------------------------------------
      */
    if (existingUser.googleId === null) {
      await this.userService.linkGoogleAccount(
        existingUser.id,
        profile.googleId,
      );
    }

    /*
      |--------------------------------------------------------------------------
      | EXISTING UNVERIFIED USER
      |--------------------------------------------------------------------------
      | A successful Google login is not enough for this app's rules. Unverified
      | accounts must complete OTP verification before tokens are issued.
      |--------------------------------------------------------------------------
      */
    if (!existingUser.isVerified) {
      await this.helper.sendOtp(
        existingUser.id,
        existingUser.email,
        existingUser.name,
        'verify',
      );

      return {
        status: 'verification_required',
        email: existingUser.email,
        message:
          'Your account needs email verification. A fresh OTP has been sent.',
      };
    }

    /*
      |--------------------------------------------------------------------------
      | VERIFIED GOOGLE USER
      |--------------------------------------------------------------------------
      | Once verification is complete, Google sign-in reuses the normal token
      | generation path and returns the standard application auth cookies.
      |--------------------------------------------------------------------------
      */
    const tokens = await this.handleTokenGeneration(
      existingUser.id,
      existingUser.email,
    );

    return {
      status: 'signed_in',
      email: existingUser.email,
      message: 'Signed in with Google successfully.',
      tokens,
    };
  }

  private async handleTokenGeneration(
    userId: string,
    email: string,
    rememberMe = false,
  ): Promise<Tokens> {
    const tokens = await this.tokenService.generateTokens(
      userId,
      email,
      rememberMe,
    );
    const hashedRt = await this.tokenService.hashData(tokens.refreshToken);
    await this.userService.updateRefreshToken(userId, hashedRt);
    return tokens;
  }
}
