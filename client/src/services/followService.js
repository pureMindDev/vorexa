import api from './api';

export const followUser = (userId) => api.post(`/follow/${userId}`);

export const unfollowUser = (userId) => api.delete(`/follow/${userId}`);

export const getFollowStats = (userId) => api.get(`/follow/${userId}/stats`);

export const getMyFollowing = () => api.get('/follow/following');
