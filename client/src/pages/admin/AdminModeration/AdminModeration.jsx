import { useState, useEffect, useCallback } from 'react';
import { getReports, resolveReport, removePost } from '../../../services/adminService';
import styles from '../adminShared.module.scss';

const AdminModeration = () => {
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getReports(tab);
      setReports(data.reports);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDismiss = async (id) => {
    setBusyId(id);
    try {
      await resolveReport(id, 'dismissed');
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not dismiss report.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveContent = async (report) => {
    if (!window.confirm('Remove this post permanently? This cannot be undone.')) return;
    setBusyId(report._id);
    try {
      if (report.targetType === 'post') {
        await removePost(report.targetId);
      }
      await resolveReport(report._id, 'resolved', 'Content removed');
      setReports((prev) => prev.filter((r) => r._id !== report._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove content.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Content Moderation</h1>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'pending' ? styles['tab--active'] : ''}`} onClick={() => setTab('pending')}>
          Pending
        </button>
        <button className={`${styles.tab} ${tab === 'resolved' ? styles['tab--active'] : ''}`} onClick={() => setTab('resolved')}>
          Resolved
        </button>
        <button className={`${styles.tab} ${tab === 'dismissed' ? styles['tab--active'] : ''}`} onClick={() => setTab('dismissed')}>
          Dismissed
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && reports.length === 0 && <p className={styles.emptyState}>No {tab} reports.</p>}

      {reports.map((r) => (
        <div key={r._id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.primaryText}>
              Report against {r.targetType} by {r.targetSnapshot?.authorName || 'unknown user'}
            </div>
            {r.targetSnapshot?.content && (
              <div className={styles.secondaryText}>"{r.targetSnapshot.content.slice(0, 140)}"</div>
            )}
            <div className={styles.secondaryText}>
              Reported by {r.reporterId?.name || 'a user'}: "{r.reason}"
            </div>
            <div className={styles.secondaryText}>{new Date(r.createdAt).toLocaleString()}</div>
          </div>

          <div className={styles.rowActions}>
            <span className={`${styles.badge} ${styles[`badge--${r.status}`]}`}>{r.status}</span>
            {r.status === 'pending' && (
              <>
                <button
                  className={`${styles.btn} ${styles['btn--ghost']}`}
                  disabled={busyId === r._id}
                  onClick={() => handleDismiss(r._id)}
                >
                  Dismiss
                </button>
                <button
                  className={`${styles.btn} ${styles['btn--danger']}`}
                  disabled={busyId === r._id}
                  onClick={() => handleRemoveContent(r)}
                >
                  Remove content
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminModeration;
