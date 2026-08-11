import api from './api';

export const toggleBookmark = (courseId, lessonId) => api.post('/bookmarks/toggle', { courseId, lessonId });

export const getMyBookmarks = () => api.get('/bookmarks');
