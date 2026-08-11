import api from './api';

// Vorexa settles payments over WhatsApp — the API records the payment and
// returns a prefilled chat link instead of a gateway checkout URL.
export const requestPayment = (bookingId) => api.post('/payments/request', { bookingId });

export const getUpgradeLink = () => api.get('/payments/upgrade-link');

export const getMyPayments = () => api.get('/payments/mine');

export const confirmPayment = (id, status = 'success') => api.put(`/payments/${id}/confirm`, { status });
