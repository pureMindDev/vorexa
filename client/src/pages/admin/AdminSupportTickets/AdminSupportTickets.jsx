import { useState, useEffect, useCallback } from 'react';
import { getSupportTickets, respondToTicket } from '../../../services/adminService';
import styles from '../adminShared.module.scss';

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getSupportTickets(tab === 'all' ? undefined : tab);
      setTickets(data.tickets);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (id) => {
    const adminReply = replyDrafts[id]?.trim();
    if (!adminReply) return;
    setBusyId(id);
    try {
      await respondToTicket(id, { adminReply, status: 'resolved' });
      setTickets((prev) => prev.map((t) => (t._id === id ? { ...t, adminReply, status: 'resolved' } : t)));
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reply.');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (id, status) => {
    setBusyId(id);
    try {
      await respondToTicket(id, { status });
      setTickets((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update ticket.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Support Tickets</h1>

      <div className={styles.tabs}>
        {['open', 'in_progress', 'resolved', 'all'].map((s) => (
          <button key={s} className={`${styles.tab} ${tab === s ? styles['tab--active'] : ''}`} onClick={() => setTab(s)}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && tickets.length === 0 && <p className={styles.emptyState}>No tickets here.</p>}

      {tickets.map((t) => (
        <div key={t._id} className={styles.card} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
          <div className={styles.rowActions} style={{ justifyContent: 'space-between' }}>
            <div className={styles.info}>
              <div className={styles.primaryText}>{t.subject}</div>
              <div className={styles.secondaryText}>
                {t.userId?.name} ({t.userId?.email}) · {new Date(t.createdAt).toLocaleString()}
              </div>
            </div>
            <span className={`${styles.badge} ${styles[`badge--${t.status}`]}`}>{t.status.replace('_', ' ')}</span>
          </div>

          <div className={styles.secondaryText}>{t.message}</div>

          {t.adminReply && (
            <div className={styles.secondaryText} style={{ fontStyle: 'italic' }}>
              Your reply: "{t.adminReply}"
            </div>
          )}

          {t.status !== 'resolved' && (
            <>
              <textarea
                className={styles.textarea}
                placeholder="Write a reply..."
                value={replyDrafts[t._id] || ''}
                onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [t._id]: e.target.value }))}
              />
              <div className={styles.rowActions}>
                {t.status === 'open' && (
                  <button
                    className={`${styles.btn} ${styles['btn--ghost']}`}
                    disabled={busyId === t._id}
                    onClick={() => handleStatusChange(t._id, 'in_progress')}
                  >
                    Mark in progress
                  </button>
                )}
                <button
                  className={`${styles.btn} ${styles['btn--primary']}`}
                  disabled={busyId === t._id || !replyDrafts[t._id]?.trim()}
                  onClick={() => handleReply(t._id)}
                >
                  Send reply & resolve
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminSupportTickets;
