import { useState, useEffect, useCallback } from 'react';
import { FiUserPlus, FiCheck, FiX } from 'react-icons/fi';
import {
  sendPartnerRequest,
  getMyPartnerships,
  respondToPartnerRequest,
  endPartnership,
  postCheckIn,
  getCheckIns,
} from '../../services/accountabilityService';
import styles from './AccountabilityPartners.module.scss';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const AccountabilityPartners = () => {
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [checkInDraft, setCheckInDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyPartnerships();
      setPartnerships(data.partnerships);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load partnerships.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendPartnerRequest(email.trim(), goal.trim());
      setEmail('');
      setGoal('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send request.');
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (id, action) => {
    try {
      await respondToPartnerRequest(id, action);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not respond to request.');
    }
  };

  const handleEnd = async (id) => {
    if (!window.confirm('End this partnership?')) return;
    try {
      await endPartnership(id);
      setPartnerships((prev) => prev.filter((p) => p.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not end partnership.');
    }
  };

  const toggleExpand = async (partnership) => {
    if (expandedId === partnership.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(partnership.id);
    try {
      const { data } = await getCheckIns(partnership.id);
      setCheckIns(data.checkIns);
    } catch {
      setCheckIns([]);
    }
  };

  const handlePostCheckIn = async (partnershipId) => {
    if (!checkInDraft.trim()) return;
    try {
      const { data } = await postCheckIn(partnershipId, checkInDraft.trim());
      setCheckIns((prev) => [{ ...data.checkIn, userId: { name: 'You' } }, ...prev]);
      setCheckInDraft('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post check-in.');
    }
  };

  const active = partnerships.filter((p) => p.status === 'active');
  const pending = partnerships.filter((p) => p.status === 'pending');

  return (
    <div>
      <h1 className={styles.title}>Accountability Partners</h1>
      <p className={styles.subtitle}>Pair up with another student to keep each other on track.</p>

      <form className={styles.requestForm} onSubmit={handleSendRequest}>
        <input
          className={styles.input}
          placeholder="Partner's email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Shared goal (optional)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <button className={styles.sendBtn} type="submit" disabled={sending || !email.trim()}>
          <FiUserPlus size={15} /> Send request
        </button>
      </form>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}

      {pending.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Pending</h2>
          {pending.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.info}>
                <div className={styles.primaryText}>{p.partner.name}</div>
                {p.goal && <div className={styles.secondaryText}>Goal: {p.goal}</div>}
              </div>
              {p.isIncoming ? (
                <div className={styles.actions}>
                  <button className={`${styles.iconBtn} ${styles['iconBtn--accept']}`} onClick={() => handleRespond(p.id, 'accept')}>
                    <FiCheck size={16} />
                  </button>
                  <button className={`${styles.iconBtn} ${styles['iconBtn--decline']}`} onClick={() => handleRespond(p.id, 'decline')}>
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <span className={styles.waitingLabel}>Waiting for response...</span>
              )}
            </div>
          ))}
        </>
      )}

      <h2 className={styles.sectionTitle}>Active Partnerships</h2>
      {!loading && active.length === 0 && <p className={styles.emptyState}>No active partnerships yet.</p>}

      {active.map((p) => (
        <div key={p.id} className={styles.partnershipBlock}>
          <div className={styles.card} onClick={() => toggleExpand(p)} style={{ cursor: 'pointer' }}>
            <div className={styles.info}>
              <div className={styles.primaryText}>{p.partner.name}</div>
              <div className={styles.secondaryText}>
                {p.partner.xp} XP · {p.partner.streakCount || 0} day streak
                {p.goal && ` · Goal: ${p.goal}`}
              </div>
            </div>
            <button
              className={styles.endBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleEnd(p.id);
              }}
            >
              End
            </button>
          </div>

          {expandedId === p.id && (
            <div className={styles.checkInPanel}>
              <div className={styles.checkInComposer}>
                <input
                  className={styles.input}
                  placeholder="Post a check-in (what did you get done today?)"
                  value={checkInDraft}
                  onChange={(e) => setCheckInDraft(e.target.value)}
                />
                <button className={styles.sendBtn} onClick={() => handlePostCheckIn(p.id)} disabled={!checkInDraft.trim()}>
                  Post
                </button>
              </div>
              {checkIns.length === 0 && <p className={styles.emptyHint}>No check-ins yet.</p>}
              {checkIns.map((c, i) => (
                <div key={c._id || i} className={styles.checkInItem}>
                  <span className={styles.checkInAuthor}>{c.userId?.name}:</span> {c.content}
                  <span className={styles.checkInTime}>{timeAgo(c.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AccountabilityPartners;
