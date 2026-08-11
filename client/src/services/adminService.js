import api from './api';

export const getDashboardStats = () => api.get('/admin/dashboard');

export const getUsers = (params) => api.get('/admin/users', { params });
export const updateUserStatus = (id, status) => api.put(`/admin/users/${id}/status`, { status });
export const updateUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });

export const getPendingTutors = () => api.get('/admin/tutors/pending');
export const getAllTutors = () => api.get('/admin/tutors');
export const setTutorVerification = (id, verified) => api.put(`/admin/tutors/${id}/verify`, { verified });

export const getPayments = (params) => api.get('/admin/payments', { params });

export const getReports = (status) => api.get('/admin/reports', { params: { status } });
export const resolveReport = (id, status, resolutionNote) =>
  api.put(`/admin/reports/${id}`, { status, resolutionNote });
export const removePost = (id) => api.delete(`/admin/posts/${id}`);
export const setCoursePublished = (id, isPublished) => api.put(`/admin/courses/${id}/publish`, { isPublished });

export const getSupportTickets = (status) => api.get('/admin/support-tickets', { params: { status } });
export const respondToTicket = (id, payload) => api.put(`/admin/support-tickets/${id}`, payload);
