import api from './api';

export const getTutors = (subject) => api.get('/tutors', { params: subject ? { subject } : {} });

export const getTutorById = (userId) => api.get(`/tutors/${userId}`);

export const getMyTutorProfile = () => api.get('/tutors/me/profile');

export const upsertMyTutorProfile = (data) => api.put('/tutors/me/profile', data);

export const createTutorReview = (userId, data) => api.post(`/tutors/${userId}/reviews`, data);

export const getDashboardStats = () => api.get('/tutors/me/dashboard-stats');
