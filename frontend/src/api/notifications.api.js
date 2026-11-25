import { api } from './axios';

export const notificationsApi = {
  getAll: async (page = 1) => {
    const { data } = await api.get('/notifications', { params: { page } });
    return data.data;
  },
  markAllRead: async () => {
    const { data } = await api.patch('/notifications/read');
    return data.data;
  },
};
