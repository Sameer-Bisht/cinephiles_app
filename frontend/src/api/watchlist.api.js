import { api } from './axios';

export const watchlistApi = {
  getMyWatchlist: async (page = 1) => {
    const { data } = await api.get('/watchlist', { params: { page } });
    return data.data;
  },
  add: async (tmdbId) => {
    const { data } = await api.post(`/watchlist/${tmdbId}`);
    return data.data.item;
  },
  remove: async (tmdbId) => {
    const { data } = await api.delete(`/watchlist/${tmdbId}`);
    return data.data;
  },
};
