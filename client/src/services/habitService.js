import api from './api';

export const createHabit = (data) => api.post('/habits', data);

export const getHabits = () => api.get('/habits');

export const toggleHabitToday = (id) => api.put(`/habits/${id}/toggle-today`);

export const deleteHabit = (id) => api.delete(`/habits/${id}`);
