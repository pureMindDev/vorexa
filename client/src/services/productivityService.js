import api from './api';

export const createReminder = (data) => api.post('/productivity/reminders', data);
export const getReminders = () => api.get('/productivity/reminders');
export const deleteReminder = (id) => api.delete(`/productivity/reminders/${id}`);

export const createGoal = (data) => api.post('/productivity/goals', data);
export const getGoals = () => api.get('/productivity/goals');
export const toggleGoal = (id) => api.put(`/productivity/goals/${id}/toggle`);
export const deleteGoal = (id) => api.delete(`/productivity/goals/${id}`);

export const createEvent = (data) => api.post('/productivity/events', data);
export const deleteEvent = (id) => api.delete(`/productivity/events/${id}`);

export const getCalendarMonth = (year, month) => api.get('/productivity/calendar', { params: { year, month } });
