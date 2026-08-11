import api from './api';

export const createGroup = (data) => api.post('/groups', data);

export const getGroups = (params) => api.get('/groups', { params });

export const getGroupById = (id) => api.get(`/groups/${id}`);

export const joinGroup = (id, inviteCode) => api.post(`/groups/${id}/join`, { inviteCode });

export const leaveGroup = (id) => api.post(`/groups/${id}/leave`);

export const getGroupPosts = (id) => api.get(`/groups/${id}/posts`);

export const createGroupPost = (id, content) => api.post(`/groups/${id}/posts`, { content });
