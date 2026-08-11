import { useState, useEffect } from 'react';
import { getMyBookingsAsTutor, updateBookingStatus } from '../../../services/bookingService';
import styles from './TutorBookings.module.scss';

const TutorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMyBookingsAsTutor();
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

  const handleStatusChange = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update booking.');
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Bookings</h1>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {!loading && bookings.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No booking requests yet.</p>
      )}

      {bookings.map((b) => (
        <div key={b.id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.subject}>{b.subject} — {b.studentName}</div>
            <div className={styles.meta}>{b.preferredTime} · ₦{b.amount?.toLocaleString()} {b.isPaid ? '· Paid' : '· Unpaid'}</div>
            {b.message && <div className={styles.message}>"{b.message}"</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`${styles.statusBadge} ${styles[`statusBadge--${b.status}`]}`}>{b.status}</span>

            {b.status === 'pending' && (
              <div className={styles.actions}>
                <button className={`${styles.actionBtn} ${styles['actionBtn--accept']}`} onClick={() => handleStatusChange(b.id, 'accepted')}>
                  Accept
                </button>
                <button className={`${styles.actionBtn} ${styles['actionBtn--decline']}`} onClick={() => handleStatusChange(b.id, 'declined')}>
                  Decline
                </button>
              </div>
            )}
            {b.status === 'accepted' && (
              <button className={`${styles.actionBtn} ${styles['actionBtn--complete']}`} onClick={() => handleStatusChange(b.id, 'completed')}>
                Mark completed
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TutorBookings;
