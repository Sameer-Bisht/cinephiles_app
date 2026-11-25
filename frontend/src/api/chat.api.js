import { api } from './axios';

export const chatApi = {
  getConversations: async () => {
    const { data } = await api.get('/chat/conversations');
    return data.data.conversations;
  },
  startConversation: async (username) => {
    const { data } = await api.post('/chat/conversations', { username });
    return data.data.conversation;
  },
  respondToRequest: async (conversationId, action) => {
    const { data } = await api.patch(`/chat/conversations/${conversationId}/respond`, { action });
    return data.data.conversation;
  },
  getMessages: async (conversationId, cursor = null) => {
    const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: cursor ? { cursor } : {},
    });
    return data.data;
  },
  markRead: async (conversationId) => {
    await api.patch(`/chat/conversations/${conversationId}/read`);
  },
};
