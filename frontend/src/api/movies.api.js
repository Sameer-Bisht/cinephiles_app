import { api } from './axios';

export const moviesApi = {
  getTrending: async (page = 1, type = 'all') => {
    const { data } = await api.get('/movies/trending', { params: { page, type } });
    return data.data;
  },
  searchMovies: async (q, page = 1, type = 'all') => {
    const { data } = await api.get('/movies/search', { params: { q, page, type } });
    return data.data;
  },
  getMovieDetail: async (tmdbId, mediaType = 'movie') => {
    const { data } = await api.get(`/movies/${mediaType}/${tmdbId}`);
    return data.data;
  },
};
