import { api } from './axios';

export const authApi = {
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data.data;
  },
  refresh: async () => {
    const { data } = await api.post('/auth/refresh');
    return data.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
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
