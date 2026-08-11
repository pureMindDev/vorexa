import { useState, useEffect, useCallback } from 'react';
import { getAllTutors, setTutorVerification } from '../../../services/adminService';
import styles from '../adminShared.module.scss';

const AdminTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [tab, setTab] = useState('pending'); // pending | all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getAllTutors();
      setTutors(data.tutors);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load tutors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async (id, verified) => {
    setBusyId(id);
    try {
      await setTutorVerification(id, verified);
      setTutors((prev) => prev.map((t) => (t._id === id ? { ...t, isVerified: verified } : t)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update verification.');
    } finally {
      setBusyId(null);
    }
  };

  const visibleTutors = tab === 'pending' ? tutors.filter((t) => !t.isVerified) : tutors;

  return (
    <div>
      <h1 className={styles.title}>Tutor Verification</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'pending' ? styles['tab--active'] : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending ({tutors.filter((t) => !t.isVerified).length})
        </button>
        <button
          className={`${styles.tab} ${tab === 'all' ? styles['tab--active'] : ''}`}
          onClick={() => setTab('all')}
        >
          All Tutors ({tutors.length})
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && visibleTutors.length === 0 && (
        <p className={styles.emptyState}>
          {tab === 'pending' ? 'No tutors awaiting verification.' : 'No tutors yet.'}
        </p>
      )}

      {visibleTutors.map((t) => (
        <div key={t._id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.primaryText}>{t.userId?.name || 'Unknown'}</div>
            <div className={styles.secondaryText}>
              {t.userId?.email} · {t.subjects?.join(', ') || 'No subjects listed'} · ₦{t.hourlyRate?.toLocaleString()}/hr ·{' '}
              {t.yearsExperience} yrs experience
            </div>
            {t.bio && <div className={styles.secondaryText}>"{t.bio}"</div>}
          </div>

          <div className={styles.rowActions}>
            <span className={`${styles.badge} ${styles[t.isVerified ? 'badge--verified' : 'badge--pending']}`}>
              {t.isVerified ? 'Verified' : 'Pending'}
            </span>
            {t.isVerified ? (
              <button
                className={`${styles.btn} ${styles['btn--ghost']}`}
                disabled={busyId === t._id}
                onClick={() => handleVerify(t._id, false)}
              >
                Revoke
              </button>
            ) : (
              <button
                className={`${styles.btn} ${styles['btn--success']}`}
                disabled={busyId === t._id}
                onClick={() => handleVerify(t._id, true)}
              >
                Verify
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminTutors;
