import { api } from './axios';

const REFRESH_KEY = 'reelclub_refresh_token';

const persistRefreshToken = (data) => {
  if (data?.refreshToken) {
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
  }
  return data;
};

export const authApi = {
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return persistRefreshToken(data.data);
  },
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return persistRefreshToken(data.data);
  },
  refresh: async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const { data } = await api.post('/auth/refresh', refreshToken ? { refreshToken } : {});
    return persistRefreshToken(data.data);
  },
  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    localStorage.removeItem(REFRESH_KEY);
    await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
  },
  updateProfile: async (payload) => {
    const { data } = await api.patch('/users/me', payload);
    return data.data.user;
  },
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.patch('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.user;
  },
};
