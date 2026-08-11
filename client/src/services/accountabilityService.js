import api from './api';

export const sendPartnerRequest = (email, goal) => api.post('/accountability/requests', { email, goal });
export const getMyPartnerships = () => api.get('/accountability/requests');
export const respondToPartnerRequest = (id, action) => api.put(`/accountability/requests/${id}`, { action });
export const endPartnership = (id) => api.delete(`/accountability/requests/${id}`);

export const postCheckIn = (partnershipId, content) => api.post(`/accountability/${partnershipId}/checkins`, { content });
export const getCheckIns = (partnershipId) => api.get(`/accountability/${partnershipId}/checkins`);
