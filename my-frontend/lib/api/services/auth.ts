import { api } from '../api';
import { API_METHODS } from '@/constants/api';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface SignInDto {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

export const authService = {
  signUp: (data: CreateUserDto) =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/sign-up',
      data,
      showToast: true,
    }),

  verifyEmail: (data: VerifyOtpDto) =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/verify-email',
      data,
      showToast: true,
    }),

  resendOtp: (email: string) =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/resend-otp',
      data: { email },
      showToast: true,
    }),

  signIn: (data: SignInDto) =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/sign-in',
      data,
      showToast: true,
      skipAuth: true,
    }),

  forgotPassword: (data: ForgotPasswordDto) =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/forgot-password',
      data,
      showToast: true,
      skipAuth: true,
    }),

  resetPassword: (data: ResetPasswordDto) =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/reset-password',
      data,
      showToast: true,
    }),

  logout: () =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/logout',
      showToast: true,
    }),

  refresh: () =>
    api({
      method: API_METHODS.POST,
      endpoint: '/auth/refresh',
      skipAuth: true,
    }),
};
