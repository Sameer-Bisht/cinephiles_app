import { api } from './axios';

export const newsApi = {
  getLatest: async (source = 'all', limit = 30) => {
    const { data } = await api.get('/news', { params: { source, limit } });
    return data.data;
  },
  getForYou: async () => {
    const { data } = await api.get('/news/for-you');
    return data.data;
  },
};
