import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyChildren, getChildProgress, getChildAttendance, getChildPayments } from '../../../services/parentService';
import styles from './ParentDashboard.module.scss';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
};

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('progress');
  const [progress, setProgress] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [payments, setPayments] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyChildren();
        setChildren(data.children);
        if (data.children.length > 0) setSelectedId(data.children[0].id);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your children.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadDetail = useCallback(async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      if (tab === 'progress') {
        const { data } = await getChildProgress(selectedId);
        setProgress(data);
      } else if (tab === 'attendance') {
        const { data } = await getChildAttendance(selectedId);
        setAttendance(data.attendance);
      } else if (tab === 'payments') {
        const { data } = await getChildPayments(selectedId);
        setPayments(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load that data.');
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId, tab]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const selectedChild = children.find((c) => c.id === selectedId);

  if (loading) return <p className={styles.loadingText}>Loading...</p>;

  if (children.length === 0) {
    return (
      <div>
        <h1 className={styles.title}>My Children</h1>
        <p className={styles.emptyState}>
          You haven't linked with any student accounts yet.{' '}
          <Link to="/parent/link-child" className={styles.link}>Link a child</Link> to start viewing their progress.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.title}>My Children</h1>

      <div className={styles.childTabs}>
        {children.map((c) => (
          <button
            key={c.id}
            className={`${styles.childTab} ${selectedId === c.id ? styles['childTab--active'] : ''}`}
            onClick={() => setSelectedId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {selectedChild && (
        <>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>XP</div>
              <div className={styles.statValue}>{selectedChild.xp}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Streak</div>
              <div className={styles.statValue}>{selectedChild.streakCount} days</div>
            </div>
          </div>

          <div className={styles.tabs}>
            {['progress', 'attendance', 'payments'].map((t) => (
              <button key={t} className={`${styles.tab} ${tab === t ? styles['tab--active'] : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {detailLoading && <p className={styles.loadingText}>Loading...</p>}

          {!detailLoading && tab === 'progress' && progress && (
            <div className={styles.detailCard}>
              <div className={styles.miniStatRow}>
                <div>
                  <div className={styles.miniStatValue}>{progress.lessonsCompleted}</div>
                  <div className={styles.miniStatLabel}>Lessons completed</div>
                </div>
                <div>
                  <div className={styles.miniStatValue}>{progress.cbtThisWeek}</div>
                  <div className={styles.miniStatLabel}>CBT attempts this week</div>
                </div>
                <div>
                  <div className={styles.miniStatValue}>
                    {progress.averageCbtScore !== null ? `${Math.round(progress.averageCbtScore)}%` : '—'}
                  </div>
                  <div className={styles.miniStatLabel}>Avg. CBT score</div>
                </div>
              </div>

              <h3 className={styles.subheading}>Recent CBT attempts</h3>
              {progress.recentCbtAttempts.length === 0 && <p className={styles.emptyHint}>No CBT attempts yet.</p>}
              {progress.recentCbtAttempts.map((a) => (
                <div key={a.id} className={styles.row}>
                  <span>{a.examType} · {a.subjects?.join(', ')}</span>
                  <span>{a.score != null ? `${a.score}%` : 'In progress'}</span>
                </div>
              ))}
            </div>
          )}

          {!detailLoading && tab === 'attendance' && attendance && (
            <div className={styles.detailCard}>
              {attendance.length === 0 && <p className={styles.emptyHint}>No live class attendance yet.</p>}
              {attendance.map((a, i) => (
                <div key={i} className={styles.row}>
                  <span>{a.classTitle}</span>
                  <span>{timeAgo(a.joinedAt)}</span>
                </div>
              ))}
            </div>
          )}

          {!detailLoading && tab === 'payments' && payments && (
            <div className={styles.detailCard}>
              <div className={styles.totalPaid}>Total paid: ₦{payments.totalPaid.toLocaleString()}</div>
              {payments.payments.length === 0 && <p className={styles.emptyHint}>No payments yet.</p>}
              {payments.payments.map((p) => (
                <div key={p.id} className={styles.row}>
                  <span>{p.tutorName || 'Tutor'} · {new Date(p.createdAt).toLocaleDateString()}</span>
                  <span>₦{p.amount.toLocaleString()} ({p.status})</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
