import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { getMyCentre } from '../../../services/centreService';
import { getExams, setExamPublished } from '../../../services/centreService';
import styles from './CentreExams.module.scss';

const CentreExams = () => {
  const [centreId, setCentreId] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: centreData } = await getMyCentre();
      setCentreId(centreData.centre._id);
      const { data } = await getExams(centreData.centre._id);
      setExams(data.exams);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTogglePublish = async (exam) => {
    setBusyId(exam._id);
    try {
      const { data } = await setExamPublished(exam._id, !exam.isPublished);
      setExams((prev) => prev.map((e) => (e._id === exam._id ? data.exam : e)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update exam.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Exams</h1>
        <Link to="/centre/exams/new" className={styles.newBtn}>
          <FiPlus size={15} /> New exam
        </Link>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && exams.length === 0 && <p className={styles.emptyState}>No exams yet.</p>}

      {exams.map((exam) => (
        <div key={exam._id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.primaryText}>{exam.title}</div>
            <div className={styles.secondaryText}>
              {exam.subject || 'General'} · {exam.durationMinutes} min · {exam.questions?.length ?? '—'} questions
            </div>
          </div>
          <div className={styles.actions}>
            <span className={`${styles.badge} ${styles[exam.isPublished ? 'badge--published' : 'badge--draft']}`}>
              {exam.isPublished ? 'Published' : 'Draft'}
            </span>
            <button className={styles.actionBtn} disabled={busyId === exam._id} onClick={() => handleTogglePublish(exam)}>
              {exam.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <Link to={`/centre/exams/${exam._id}/results`} className={styles.actionBtn}>Results</Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CentreExams;
