import api from './api';

export const getSharedNotes = (groupId) => api.get(`/groups/${groupId}/notes`);
export const createSharedNote = (groupId, title, content) => api.post(`/groups/${groupId}/notes`, { title, content });
export const updateSharedNote = (groupId, noteId, payload) => api.put(`/groups/${groupId}/notes/${noteId}`, payload);
export const deleteSharedNote = (groupId, noteId) => api.delete(`/groups/${groupId}/notes/${noteId}`);

export const getSharedDecks = (groupId) => api.get(`/groups/${groupId}/flashcards`);
export const createSharedDeck = (groupId, title) => api.post(`/groups/${groupId}/flashcards`, { title });
export const addSharedCard = (groupId, deckId, front, back) =>
  api.post(`/groups/${groupId}/flashcards/${deckId}/cards`, { front, back });
export const removeSharedCard = (groupId, deckId, cardId) =>
  api.delete(`/groups/${groupId}/flashcards/${deckId}/cards/${cardId}`);
