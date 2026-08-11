import api from './api';

// Linking
export const sendLinkRequest = (email) => api.post('/parent/link-requests', { email });
export const getMyLinkRequests = () => api.get('/parent/link-requests');
export const getIncomingRequests = () => api.get('/parent/incoming-requests');
export const respondToLinkRequest = (id, action) => api.put(`/parent/link-requests/${id}`, { action });
export const revokeLink = (id) => api.delete(`/parent/link-requests/${id}`);

// Child data
export const getMyChildren = () => api.get('/parent/children');
export const getChildProgress = (studentId) => api.get(`/parent/children/${studentId}/progress`);
export const getChildAttendance = (studentId) => api.get(`/parent/children/${studentId}/attendance`);
export const getChildPayments = (studentId) => api.get(`/parent/children/${studentId}/payments`);
