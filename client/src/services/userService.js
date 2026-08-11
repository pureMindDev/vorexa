import api from './api';

export const completeOnboarding = (data) => api.put('/users/onboarding', data);

export const getLeaderboard = (limit) => api.get('/users/leaderboard', { params: { limit } });

export const getAchievements = () => api.get('/users/achievements');

export const getWeakTopics = () => api.get('/users/weak-topics');

export const getPublicProfile = (userId) => api.get(`/users/${userId}/public`);

export const toggleTwoFactor = (enable, password) => api.put('/users/2fa', { enable, password });

export const getLoginHistory = () => api.get('/users/login-history');

export const updateProfile = (name) => api.put('/users/profile', { name });

export const changePassword = (currentPassword, newPassword) =>
  api.put('/users/change-password', { currentPassword, newPassword });
