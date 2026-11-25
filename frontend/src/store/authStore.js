import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthChecking: true,

  setSession: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthChecking: false,
    }),

  updateUser: (user) => set({ user }),

  clearSession: () =>
    set({
      user: null,
      accessToken: null,
      isAuthChecking: false,
    }),

  setAuthChecking: (isAuthChecking) => set({ isAuthChecking }),
}));
