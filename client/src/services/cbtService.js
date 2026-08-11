import api from './api';

export const getSubjects = (examType) => api.get('/cbt/subjects', { params: { examType } });

export const startExam = (examType, subjects, questionsPerSubject, durationMinutes) =>
  api.post('/cbt/start', { examType, subjects, questionsPerSubject, durationMinutes });

export const resumeAttempt = (attemptId) => api.get(`/cbt/${attemptId}/resume`);

// Autosave — fired periodically during a sitting so a refresh never loses answers.
export const saveAnswers = (attemptId, answers) => api.patch(`/cbt/${attemptId}/answers`, { answers });

export const submitExam = (attemptId, answers) => api.post(`/cbt/${attemptId}/submit`, { answers });

export const getAttemptReview = (attemptId) => api.get(`/cbt/${attemptId}/review`);

export const getResults = ({ cursor, limit } = {}) =>
  api.get('/cbt/results', { params: { ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) } });

export const getAnalytics = (examType) => api.get('/cbt/analytics', { params: examType ? { examType } : {} });
