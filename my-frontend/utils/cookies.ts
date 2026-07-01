import { User } from "@/lib/api/services/user";

export const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const getCookie = (name: string) => {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const saveUser = (user: User) => {
  setCookie('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = getCookie('user');
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      return parsed;
    } catch (e) {
      console.error('Failed to parse user from cookies', e);
      return null;
    }
  }
  return null;
};

export const clearUser = () => {
  deleteCookie('user');
};
