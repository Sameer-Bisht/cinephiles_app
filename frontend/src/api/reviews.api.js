import { api } from './axios';

export const reviewsApi = {
  getMovieReviews: async (tmdbId, { sort = 'recent', page = 1, mediaType = 'movie' } = {}) => {
    const { data } = await api.get(`/reviews/movies/${tmdbId}`, {
      params: { sort, page, type: mediaType },
    });
    return data.data;
  },
  upsertMovieReview: async (tmdbId, payload) => {
    const { data } = await api.put(`/reviews/movies/${tmdbId}`, payload);
    return data.data;
  },
  deleteReview: async (reviewId) => {
    const { data } = await api.delete(`/reviews/${reviewId}`);
    return data.data;
  },
  toggleLike: async (reviewId) => {
    const { data } = await api.post(`/reviews/${reviewId}/like`);
    return data.data;
  },
  getComments: async (reviewId) => {
    const { data } = await api.get(`/reviews/${reviewId}/comments`);
    return data.data.comments;
  },
  addComment: async (reviewId, content) => {
    const { data } = await api.post(`/reviews/${reviewId}/comments`, { content });
    return data.data.comment;
  },
};
