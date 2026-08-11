import api from './api';

export const registerUser = (data) => api.post('/auth/register', data);

export const registerTutor = (data) => api.post('/auth/register-tutor', data);

export const loginUser = (data) => api.post('/auth/login', data);

export const verifyTwoFactor = (userId, code) => api.post('/auth/verify-2fa', { userId, code });

export const verifyEmail = (email, code) => api.post('/auth/verify-email', { email, code });

export const resendVerification = (email) => api.post('/auth/resend-verification', { email });

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword });

export const getCurrentUser = () => api.get('/auth/me');
