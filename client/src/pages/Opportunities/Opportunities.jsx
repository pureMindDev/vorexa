import { useState, useEffect } from 'react';
import { FiTrash2, FiExternalLink } from 'react-icons/fi';
import { createOpportunity, getOpportunities, updateOpportunity, deleteOpportunity } from '../../services/careerService';
import styles from './Opportunities.module.scss';

const TYPES = ['scholarship', 'competition', 'internship', 'other'];
const STATUSES = ['interested', 'applied', 'awarded', 'rejected'];

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [type, setType] = useState('scholarship');
  const [deadline, setDeadline] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await getOpportunities();
      setOpportunities(data.opportunities);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await createOpportunity({ title, provider, type, deadline: deadline || null, link });
      setOpportunities((prev) => [...prev, data.opportunity]);
      setTitle(''); setProvider(''); setDeadline(''); setLink('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add opportunity.');
    }
  };

  const handleStatusChange = async (id, status) => {
    setOpportunities((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    try {
      await updateOpportunity(id, { status });
    } catch {
      // silent
    }
  };

  const handleDelete = async (id) => {
    setOpportunities((prev) => prev.filter((o) => o._id !== id));
    try {
      await deleteOpportunity(id);
    } catch {
      // silent
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Scholarships & Opportunities</h1>
        <p className={styles.subtitle}>Track scholarships, competitions, and internships you've found — add ones you discover elsewhere.</p>
      </div>

      <form className={styles.form} onSubmit={handleAdd}>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input className={styles.input} placeholder="e.g. MTN Foundation Scholarship" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Provider (optional)</label>
            <input className={styles.input} placeholder="e.g. MTN Foundation" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </div>
          <div className={styles.narrowField}>
            <label className={styles.label}>Type</label>
            <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className={styles.narrowField}>
            <label className={styles.label}>Deadline (optional)</label>
            <input type="date" className={styles.input} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <div className={styles.formRow} style={{ marginTop: '0.75rem' }}>
          <div className={styles.field}>
            <label className={styles.label}>Link (optional)</label>
            <input className={styles.input} placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <button className={styles.addBtn} type="submit">Add</button>
        </div>
      </form>

      {error && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>}
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>}
      {!loading && opportunities.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No opportunities tracked yet — add one above.</p>
      )}

      {opportunities.map((o) => (
        <div key={o._id} className={styles.item}>
          <div className={styles.itemHeader}>
            <div>
              <span className={styles.itemTitle}>{o.title}</span>
              <span className={styles.typeTag}>{o.type}</span>
              <div className={styles.itemMeta}>
                {o.provider}{o.provider && o.deadline ? ' · ' : ''}
                {o.deadline ? `Deadline: ${new Date(o.deadline).toLocaleDateString()}` : ''}
              </div>
            </div>
            <button className={styles.deleteBtn} onClick={() => handleDelete(o._id)} aria-label="Delete">
              <FiTrash2 size={15} />
            </button>
          </div>
          <div className={styles.itemFooter}>
            {o.link ? (
              <a className={styles.link} href={o.link} target="_blank" rel="noopener noreferrer">
                <FiExternalLink size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                View link
              </a>
            ) : <span />}
            <select
              className={`${styles.statusSelect} ${styles[`statusSelect--${o.status}`]}`}
              value={o.status}
              onChange={(e) => handleStatusChange(o._id, e.target.value)}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Opportunities;
