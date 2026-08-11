import api from './api';

// Plain-text post — kept simple (JSON body) for the common case with no attachment.
export const createPost = (content) => api.post('/posts', { content });

// Post with a media attachment (image/video/file), with or without accompanying text.
export const createPostWithMedia = (content, file) => {
  const formData = new FormData();
  if (content) formData.append('content', content);
  formData.append('media', file);
  return api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Cursor-paginated feed. Pass the `nextCursor` from the previous page to keep scrolling.
export const getFeed = ({ userId, cursor, limit } = {}) =>
  api.get('/posts', { params: { ...(userId ? { userId } : {}), ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) } });

export const toggleLike = (postId) => api.post(`/posts/${postId}/like`);

export const addComment = (postId, content) => api.post(`/posts/${postId}/comments`, { content });

export const deletePost = (postId) => api.delete(`/posts/${postId}`);

export const reportPost = (postId, reason) => api.post(`/posts/${postId}/report`, { reason });
