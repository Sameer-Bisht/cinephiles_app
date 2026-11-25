import { api } from './axios';

export const socialApi = {
  searchUsers: async (q) => {
    const { data } = await api.get('/users/search', { params: { q } });
    return data.data.users;
  },
  getProfile: async (username) => {
    const { data } = await api.get(`/users/${username}`);
    return data.data;
  },
  getUserReviews: async (username, page = 1) => {
    const { data } = await api.get(`/users/${username}/reviews`, { params: { page } });
    return data.data;
  },
  getUserWatchlist: async (username, page = 1) => {
    const { data } = await api.get(`/users/${username}/watchlist`, { params: { page } });
    return data.data;
  },
  follow: async (username) => {
    const { data } = await api.post(`/users/${username}/follow`);
    return data.data;
  },
  unfollow: async (username) => {
    const { data } = await api.delete(`/users/${username}/follow`);
    return data.data;
  },
  getFollowers: async (username, page = 1) => {
    const { data } = await api.get(`/users/${username}/followers`, { params: { page } });
    return data.data;
  },
  getFollowing: async (username, page = 1) => {
    const { data } = await api.get(`/users/${username}/following`, { params: { page } });
    return data.data;
  },
  getFriends: async () => {
    const { data } = await api.get('/users/me/friends');
    return data.data.friends;
  },
  getFeed: async (cursor = null) => {
    const { data } = await api.get('/reviews/feed', {
      params: cursor ? { cursor } : {},
    });
    return data.data;
  },
};
