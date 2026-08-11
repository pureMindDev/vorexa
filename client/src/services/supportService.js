import api from './api';

export const createSupportTicket = (subject, message) => api.post('/support/tickets', { subject, message });
export const getMySupportTickets = () => api.get('/support/tickets');
