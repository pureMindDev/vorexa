import api from './api';

export const createTask = (data) => api.post('/tasks', data);

export const getTasks = () => api.get('/tasks');

export const toggleTask = (id) => api.put(`/tasks/${id}/toggle`);

export const deleteTask = (id) => api.delete(`/tasks/${id}`);
