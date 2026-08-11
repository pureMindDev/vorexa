import api from './api';

export const createBooking = (data) => api.post('/bookings', data);

export const getMyBookingsAsStudent = () => api.get('/bookings/as-student');

export const getMyBookingsAsTutor = () => api.get('/bookings/as-tutor');

export const updateBookingStatus = (id, status) => api.put(`/bookings/${id}/status`, { status });
