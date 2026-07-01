import { create } from 'zustand';
import { authService, CreateUserDto, SignInDto, VerifyOtpDto, ResetPasswordDto } from '@/lib/api/services/auth';
import { userService, User } from '@/lib/api/services/user';
import { saveUser, getUser, clearUser } from '@/utils/cookies';
import { useProjectStore } from './useProjectStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;

  setUser: (user: User | null) => void;
  signUp: (data: CreateUserDto) => Promise<any>;
  signIn: (data: SignInDto) => Promise<any>;
  verifyEmail: (data: VerifyOtpDto) => Promise<any>;
  resetPassword: (data: ResetPasswordDto) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  signInWithGoogle: () => void;
}

const initialUser = getUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isLoading: false,
  isInitialLoading: !initialUser,

  setUser: (user) => {
    if (user) {
      saveUser(user);
    } else {
      clearUser();
      useProjectStore.getState().resetProjectState();
    }
    set({ user, isAuthenticated: !!user });
  },

  signInWithGoogle: () => {
    window.location.href = "/api/auth/google";
  },

  signUp: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.signUp(data);
      return response;
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (data) => {
    set({ isLoading: true });
    try {
      useProjectStore.getState().resetProjectState();
      const response = await authService.signIn(data);
      if (response.user) {
        get().setUser(response.user);
      } else {
        await get().fetchProfile();
      }
      return response;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyEmail: async (data) => {
    set({ isLoading: true });
    try {
      useProjectStore.getState().resetProjectState();
      const response = await authService.verifyEmail(data);
      if (response.user) {
        get().setUser(response.user);
      } else {
        await get().fetchProfile();
      }
      return response;
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true });
    try {
      const response = await authService.forgotPassword({ email });
      return response;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.resetPassword(data);
      return response;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      clearUser();
      useProjectStore.getState().resetProjectState();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const user = await userService.getProfile();
      get().setUser(user);
    } catch (error) {
      clearUser();
      useProjectStore.getState().resetProjectState();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitialLoading: false });
    }
  },
}));
