import { create } from 'zustand';

const REFRESH_KEY = 'reelclub_refresh_token';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthChecking: true,

  setSession: (user, accessToken, refreshToken) => {
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    set({
      user,
      accessToken,
      isAuthChecking: false,
    });
  },

  updateUser: (user) => set({ user }),

  clearSession: () => {
    localStorage.removeItem(REFRESH_KEY);
    set({
      user: null,
      accessToken: null,
      isAuthChecking: false,
    });
  },

  setAuthChecking: (isAuthChecking) => set({ isAuthChecking }),
}));
