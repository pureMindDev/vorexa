import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookingsAsStudent } from '../../services/bookingService';
import { requestPayment } from '../../services/paymentService';
import styles from './MyBookings.module.scss';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMyBookingsAsStudent();
      setBookings(data.bookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePay = async (bookingId) => {
    setPayingId(bookingId);
    setError('');
    try {
      const { data } = await requestPayment(bookingId);
      // Payments are settled over WhatsApp — open the prefilled chat.
      window.open(data.whatsappUrl, '_blank', 'noopener');
      setPayingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start payment.');
      setPayingId(null);
    }
  };

  return (
    <div>
      <span className={styles.back} onClick={() => navigate('/tutors')}>&larr; Back to Tutor Marketplace</span>
      <h1 className={styles.title}>My Bookings</h1>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {!loading && bookings.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>You haven't requested any bookings yet.</p>
      )}

      {bookings.map((b) => (
        <div key={b.id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.subject}>{b.subject} with {b.tutorName}</div>
            <div className={styles.meta}>{b.preferredTime} · ₦{b.amount?.toLocaleString()}</div>
            {b.message && <div className={styles.message}>"{b.message}"</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`${styles.statusBadge} ${styles[`statusBadge--${b.status}`]}`}>{b.status}</span>

            {b.status === 'accepted' && !b.isPaid && (
              <button
                className={`${styles.actionBtn} ${styles['actionBtn--accept']}`}
                onClick={() => handlePay(b.id)}
                disabled={payingId === b.id}
              >
                {payingId === b.id ? 'Opening WhatsApp...' : 'Pay on WhatsApp'}
              </button>
            )}
            {b.isPaid && (
              <span className={`${styles.statusBadge} ${styles['statusBadge--accepted']}`}>Paid</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyBookings;
