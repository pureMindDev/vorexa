import api from './api';

export const getCv = () => api.get('/career/cv');
export const upsertCv = (data) => api.put('/career/cv', data);

export const createOpportunity = (data) => api.post('/career/opportunities', data);
export const getOpportunities = () => api.get('/career/opportunities');
export const updateOpportunity = (id, data) => api.put(`/career/opportunities/${id}`, data);
export const deleteOpportunity = (id) => api.delete(`/career/opportunities/${id}`);
