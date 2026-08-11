import api from './api';

export const logPomodoroSession = (type, durationMinutes) =>
  api.post('/pomodoro/sessions', { type, durationMinutes });
export const getPomodoroStats = () => api.get('/pomodoro/stats');
