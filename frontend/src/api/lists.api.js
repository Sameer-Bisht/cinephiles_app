import { api } from './axios';

export const listsApi = {
  getMyLists: async (tmdbId = null) => {
    const { data } = await api.get('/lists', {
      params: tmdbId ? { tmdbId } : {},
    });
    return data.data.lists;
  },
  getUserLists: async (username) => {
    const { data } = await api.get(`/lists/user/${username}`);
    return data.data.lists;
  },
  createList: async (payload) => {
    const { data } = await api.post('/lists', payload);
    return data.data.list;
  },
  getListDetail: async (listId, page = 1) => {
    const { data } = await api.get(`/lists/${listId}`, { params: { page } });
    return data.data;
  },
  updateList: async (listId, payload) => {
    const { data } = await api.patch(`/lists/${listId}`, payload);
    return data.data.list;
  },
  deleteList: async (listId) => {
    const { data } = await api.delete(`/lists/${listId}`);
    return data.data;
  },
  addItem: async (listId, tmdbId, mediaType = 'movie', note = '') => {
    const { data } = await api.post(`/lists/${listId}/items`, { tmdbId, mediaType, note });
    return data.data.item;
  },
  removeItem: async (listId, tmdbId) => {
    const { data } = await api.delete(`/lists/${listId}/items/${tmdbId}`);
    return data.data;
  },
};
