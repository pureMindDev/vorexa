import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyCentre, createCentre, getPerformanceReport } from '../../../services/centreService';
import styles from './CentreDashboard.module.scss';

const CentreDashboard = () => {
  const [centre, setCentre] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', description: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyCentre();
        setCentre(data.centre);
        const { data: reportData } = await getPerformanceReport();
        setStats(reportData);
      } catch (err) {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Could not load your centre.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await createCentre(form);
      setCentre(data.centre);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your centre profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.loadingText}>Loading...</p>;

  if (!centre) {
    return (
      <div>
        <h1 className={styles.title}>Set up your centre</h1>
        <p className={styles.subtitle}>Create your centre's profile to start inviting tutors and students.</p>
        <form className={styles.form} onSubmit={handleCreate}>
          <input
            className={styles.input}
            placeholder="Centre name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <textarea
            className={styles.textarea}
            placeholder="Short description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            className={styles.input}
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <input
            className={styles.input}
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          {error && <p className={styles.errorText}>{error}</p>}
          <button className={styles.submitBtn} type="submit" disabled={saving || !form.name.trim()}>
            {saving ? 'Creating...' : 'Create centre profile'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.title}>{centre.name}</h1>
      {centre.description && <p className={styles.subtitle}>{centre.description}</p>}

      {error && <p className={styles.errorText}>{error}</p>}

      {stats && (
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Students</div>
            <div className={styles.statValue}>{stats.totalStudents}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Tutors</div>
            <div className={styles.statValue}>{stats.totalTutors}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Classes held</div>
            <div className={styles.statValue}>{stats.totalClasses}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg. exam score</div>
            <div className={styles.statValue}>{stats.averageExamScore !== null ? `${stats.averageExamScore}%` : '—'}</div>
          </div>
        </div>
      )}

      <div className={styles.quickLinks}>
        <Link to="/centre/members" className={styles.quickLink}>Manage members →</Link>
        <Link to="/centre/live-classes" className={styles.quickLink}>Schedule a class →</Link>
        <Link to="/centre/exams" className={styles.quickLink}>Create an exam →</Link>
      </div>
    </div>
  );
};

export default CentreDashboard;
