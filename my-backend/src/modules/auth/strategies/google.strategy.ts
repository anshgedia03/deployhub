import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { GoogleUserProfile } from '../interface/auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ??
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  /*
  |--------------------------------------------------------------------------
  | GOOGLE PROFILE NORMALIZATION
  |--------------------------------------------------------------------------
  | Passport returns the full Google profile. This step reduces it to the
  | minimal identity fields the auth service needs for app login logic.
  |--------------------------------------------------------------------------
  */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(
        new UnauthorizedException('Google account did not provide an email'),
        false,
      );
    }

    const user: GoogleUserProfile = {
      googleId: profile.id,
      email,
      name: profile.displayName || email.split('@')[0],
    };

    done(null, user);
  }
}
