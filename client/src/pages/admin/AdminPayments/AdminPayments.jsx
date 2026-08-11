import { useState, useEffect, useCallback } from 'react';
import { getPayments } from '../../../services/adminService';
import { confirmPayment } from '../../../services/paymentService';
import styles from '../adminShared.module.scss';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getPayments({ status: status || undefined, page });
      setPayments(data.payments);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Payments arrive over WhatsApp, so an admin marks them settled by hand.
  const handleConfirm = async (id, nextStatus) => {
    setError('');
    try {
      await confirmPayment(id, nextStatus);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update payment.');
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Payments</h1>

      <div className={styles.filterBar}>
        <select
          className={styles.select}
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && payments.length === 0 && <p className={styles.emptyState}>No payments found.</p>}

      {payments.map((p) => (
        <div key={p._id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.primaryText}>₦{p.amount?.toLocaleString()}</div>
            <div className={styles.secondaryText}>
              {p.studentId?.name || 'Unknown student'} → {p.tutorId?.name || 'Unknown tutor'}
            </div>
            <div className={styles.secondaryText}>
              Ref: {p.reference} · {new Date(p.createdAt).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`${styles.badge} ${styles[`badge--${p.status}`]}`}>{p.status}</span>
            {p.status === 'pending' && (
              <>
                <button className={styles.btn} onClick={() => handleConfirm(p._id, 'success')}>
                  Mark paid
                </button>
                <button
                  className={`${styles.btn} ${styles['btn--ghost']}`}
                  onClick={() => handleConfirm(p._id, 'failed')}
                >
                  Mark failed
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={`${styles.btn} ${styles['btn--ghost']}`}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className={styles.secondaryText}>
            Page {page} of {totalPages}
          </span>
          <button
            className={`${styles.btn} ${styles['btn--ghost']}`}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
