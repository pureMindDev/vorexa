import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExamResults } from '../../../services/centreService';
import styles from './CentreExamResults.module.scss';

const CentreExamResults = () => {
  const { id } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getExamResults(id)
      .then(({ data }) => setAttempts(data.attempts))
      .catch((err) => setError(err.response?.data?.message || 'Could not load results.'))
      .finally(() => setLoading(false));
  }, [id]);

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
    : null;

  return (
    <div>
      <Link to="/centre/exams" className={styles.backLink}>← Back to exams</Link>
      <h1 className={styles.title}>Exam Results</h1>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}

      {!loading && (
        <>
          <div className={styles.summary}>
            {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
            {avgScore !== null && ` · average score ${avgScore}%`}
          </div>

          {attempts.length === 0 && <p className={styles.emptyState}>No students have taken this exam yet.</p>}

          {attempts.map((a) => (
            <div key={a._id} className={styles.row}>
              <span>{a.studentId?.name || 'Unknown student'}</span>
              <span className={styles.score}>{a.score}%</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default CentreExamResults;
