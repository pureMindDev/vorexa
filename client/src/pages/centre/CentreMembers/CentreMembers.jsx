import { useState, useEffect, useCallback } from 'react';
import { FiUserPlus } from 'react-icons/fi';
import { inviteMember, getMembers, removeMember } from '../../../services/centreService';
import styles from './CentreMembers.module.scss';

const CentreMembers = () => {
  const [tab, setTab] = useState('student');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMembers({ memberRole: tab });
      setMembers(data.members);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load members.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await inviteMember(email.trim(), tab);
      setEmail('');
      setSuccess('Invite sent.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the invite.');
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this member from the centre?')) return;
    try {
      await removeMember(id);
      setMembers((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this member.');
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Members</h1>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'student' ? styles['tab--active'] : ''}`} onClick={() => setTab('student')}>
          Students
        </button>
        <button className={`${styles.tab} ${tab === 'tutor' ? styles['tab--active'] : ''}`} onClick={() => setTab('tutor')}>
          Tutors
        </button>
      </div>

      <form className={styles.form} onSubmit={handleInvite}>
        <input
          className={styles.input}
          type="email"
          placeholder={`Invite a ${tab} by email`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className={styles.sendBtn} type="submit" disabled={sending || !email.trim()}>
          <FiUserPlus size={15} /> Invite
        </button>
      </form>

      {error && <p className={styles.errorText}>{error}</p>}
      {success && <p className={styles.successText}>{success}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && members.length === 0 && <p className={styles.emptyState}>No {tab}s yet.</p>}

      {members.map((m) => (
        <div key={m._id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.primaryText}>{m.userId?.name}</div>
            <div className={styles.secondaryText}>{m.userId?.email}</div>
          </div>
          <span className={`${styles.badge} ${styles[`badge--${m.status}`]}`}>{m.status}</span>
          {m.status !== 'removed' && (
            <button className={styles.removeBtn} onClick={() => handleRemove(m._id)}>Remove</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default CentreMembers;
