import api from './api';

export const updateDreamGoal = (data) => api.put('/academic/dream-goal', data);

export const getExamProgress = () => api.get('/academic/exam-progress');

export const createAdmission = (data) => api.post('/academic/admissions', data);
export const getAdmissions = () => api.get('/academic/admissions');
export const updateAdmission = (id, data) => api.put(`/academic/admissions/${id}`, data);
export const deleteAdmission = (id) => api.delete(`/academic/admissions/${id}`);

export const createGpaRecord = (data) => api.post('/academic/gpa', data);
export const getGpaRecords = () => api.get('/academic/gpa');
export const deleteGpaRecord = (id) => api.delete(`/academic/gpa/${id}`);
