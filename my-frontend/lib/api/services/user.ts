import { api } from '../api';
import { API_METHODS } from '@/constants/api';

export interface User {
  id: string;
  name: string;
  email: string;
  isVerified?: boolean;
  provider?: string;
  googleId?: string;
}

export const userService = {
  getProfile: async () => {
    const response = await api<any, { user: User }>({
      method: API_METHODS.GET,
      endpoint: '/user/profile',
      showToast: false,
    });

    return response.user;
  },
};
