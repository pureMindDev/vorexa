import api from './api';

// Profile
export const createCentre = (payload) => api.post('/centre/profile', payload);
export const getMyCentre = () => api.get('/centre/profile');
export const updateCentre = (payload) => api.put('/centre/profile', payload);

// Members
export const inviteMember = (email, memberRole) => api.post('/centre/members', { email, memberRole });
export const getMembers = (params) => api.get('/centre/members', { params });
export const removeMember = (id) => api.delete(`/centre/members/${id}`);

// Invites (tutor/student side)
export const getMyInvites = () => api.get('/centre/my-invites');
export const respondToInvite = (id, action) => api.put(`/centre/my-invites/${id}`, { action });
export const leaveCentre = (id) => api.delete(`/centre/my-invites/${id}`);

// Custom exams
export const createExam = (payload) => api.post('/centre/exams', payload);
export const setExamPublished = (id, isPublished) => api.put(`/centre/exams/${id}/publish`, { isPublished });
export const getExams = (centreId) => api.get('/centre/exams', { params: { centreId } });
export const getExam = (id) => api.get(`/centre/exams/${id}`);
export const submitExam = (id, answers) => api.post(`/centre/exams/${id}/submit`, { answers });
export const getExamResults = (id) => api.get(`/centre/exams/${id}/results`);

// Reporting
export const getPerformanceReport = () => api.get('/centre/reports');
export const getCentrePayments = () => api.get('/centre/payments');
