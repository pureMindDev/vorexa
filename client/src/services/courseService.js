import api from './api';

// Cursor-paginated catalogue: pass the previous response's `nextCursor` for the next page.
export const getCourses = ({ subject, cursor, limit, search } = {}) =>
  api.get('/courses', {
    params: {
      ...(subject ? { subject } : {}),
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit } : {}),
      ...(search ? { search } : {}),
    },
  });

export const getCourseById = (id) => api.get(`/courses/${id}`);

export const completeLesson = (courseId, lessonId) =>
  api.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
