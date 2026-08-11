import api from './api';

export const getConversations = () => api.get('/messages/conversations');

export const startConversation = (userId) => api.post(`/messages/conversations/${userId}/start`);

export const getMessages = (conversationId) => api.get(`/messages/conversations/${conversationId}`);

export const sendMessage = (conversationId, content) =>
  api.post(`/messages/conversations/${conversationId}`, { content });

export const getUnreadMessageCount = () => api.get('/messages/unread-count');

export const toggleMessageReaction = (messageId, emoji) =>
  api.put(`/messages/${messageId}/react`, { emoji });
