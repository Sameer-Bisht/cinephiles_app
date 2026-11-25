import { api } from './axios';

export const moviesApi = {
  getTrending: async (page = 1) => {
    const { data } = await api.get('/movies/trending', { params: { page } });
    return data.data;
  },
  searchMovies: async (q, page = 1) => {
    const { data } = await api.get('/movies/search', { params: { q, page } });
    return data.data;
  },
  getMovieDetail: async (tmdbId) => {
    const { data } = await api.get(`/movies/${tmdbId}`);
    return data.data;
  },
};
