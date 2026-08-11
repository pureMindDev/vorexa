import { useState, useEffect } from 'react';
import { getMyPayments } from '../../services/paymentService';
import styles from './PaymentHistory.module.scss';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyPayments()
      .then(({ data }) => setPayments(data.payments))
      .catch((err) => setError(err.response?.data?.message || 'Could not load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className={styles.title}>Payment History</h1>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {!loading && payments.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No payments yet.</p>
      )}

      {payments.map((p) => (
        <div key={p.id} className={styles.item}>
          <div className={styles.info}>
            <div className={styles.tutorName}>{p.tutorName}</div>
            <div className={styles.meta}>{new Date(p.createdAt).toLocaleString()}</div>
          </div>
          <span className={styles.amount}>₦{p.amount.toLocaleString()}</span>
          <span className={`${styles.statusBadge} ${styles[`statusBadge--${p.status}`]}`}>{p.status}</span>
        </div>
      ))}
    </div>
  );
};

export default PaymentHistory;
