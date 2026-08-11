import { useState, useEffect, useCallback } from 'react';
import { FiUserPlus } from 'react-icons/fi';
import { sendLinkRequest, getMyLinkRequests, revokeLink } from '../../../services/parentService';
import styles from './ParentLinkChild.module.scss';

const ParentLinkChild = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyLinkRequests();
      setLinks(data.links);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await sendLinkRequest(email.trim());
      setEmail('');
      setSuccess('Request sent — your child needs to approve it from their Settings page.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the request.');
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Remove this link?')) return;
    try {
      await revokeLink(id);
      setLinks((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this link.');
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Link a Child</h1>
      <p className={styles.subtitle}>
        Enter your child's Vorexa account email. They'll need to approve the request from their Settings page.
      </p>

      <form className={styles.form} onSubmit={handleSend}>
        <input
          className={styles.input}
          type="email"
          placeholder="Child's email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className={styles.sendBtn} type="submit" disabled={sending || !email.trim()}>
          <FiUserPlus size={15} /> Send request
        </button>
      </form>

      {error && <p className={styles.errorText}>{error}</p>}
      {success && <p className={styles.successText}>{success}</p>}

      <h2 className={styles.sectionTitle}>Your requests</h2>
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && links.length === 0 && <p className={styles.emptyState}>No requests sent yet.</p>}

      {links.map((l) => (
        <div key={l._id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.primaryText}>{l.studentId?.name}</div>
            <div className={styles.secondaryText}>{l.studentId?.email}</div>
          </div>
          <span className={`${styles.badge} ${styles[`badge--${l.status}`]}`}>{l.status}</span>
          {l.status === 'approved' && (
            <button className={styles.revokeBtn} onClick={() => handleRevoke(l._id)}>Remove</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ParentLinkChild;
