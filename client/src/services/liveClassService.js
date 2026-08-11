import api from './api';

export const createLiveClass = (payload) => api.post('/live-classes', payload);
export const getMyLiveClasses = () => api.get('/live-classes');
export const getLiveClass = (id) => api.get(`/live-classes/${id}`);
export const startLiveClass = (id) => api.put(`/live-classes/${id}/start`);
export const endLiveClass = (id) => api.put(`/live-classes/${id}/end`);
export const recordJoin = (id) => api.post(`/live-classes/${id}/attendance/join`);
export const recordLeave = (id) => api.post(`/live-classes/${id}/attendance/leave`);
export const getAttendance = (id) => api.get(`/live-classes/${id}/attendance`);
