import { api } from './axios';

export const watchlistApi = {
  getMyWatchlist: async (page = 1) => {
    const { data } = await api.get('/watchlist', { params: { page } });
    return data.data;
  },
  add: async (tmdbId, mediaType = 'movie') => {
    const { data } = await api.post(`/watchlist/${tmdbId}`, { mediaType });
    return data.data.item;
  },
  remove: async (tmdbId, mediaType = 'movie') => {
    const { data } = await api.delete(`/watchlist/${tmdbId}`, { params: { type: mediaType } });
    return data.data;
  },
};
