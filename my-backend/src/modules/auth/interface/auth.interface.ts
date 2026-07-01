export interface JwtPayload {
  sub: string;
  email: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  googleId: string;
}

export interface IUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  password?: string | null;
  provider?: 'local' | 'google';
  googleId?: string | null;
  refreshToken?: string | null;
  isVerified: boolean;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISendOtpUser {
  name: string;
  email: string;
  id: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  provider?: string;
  googleId?: string | null;
  password?: string | null;
}

export interface AuthResponse {
  tokens: Tokens;
  user: SafeUser;
}
