import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttemptReview } from '../../services/cbtService';
import styles from './ExamReview.module.scss';

const ExamReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getAttemptReview(attemptId);
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load review.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading review...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <span className={styles.back} onClick={() => navigate('/cbt')}>&larr; Back to CBT</span>
      <h1 className={styles.title}>{data.subjects?.join(', ')} &middot; Answer review</h1>

      {data.review.map((item, i) => (
        <div key={i} className={styles.questionCard}>
          {data.subjects?.length > 1 && (
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {item.subject}
            </p>
          )}
          <p className={styles.questionText}>{i + 1}. {item.questionText}</p>
          <div className={styles.options}>
            {item.options.map((option, oi) => {
              let cls = styles.option;
              if (oi === item.correctAnswer) cls += ` ${styles['option--correct']}`;
              else if (oi === item.selectedOption && !item.isCorrect) cls += ` ${styles['option--wrong']}`;
              return (
                <div key={oi} className={cls}>
                  {String.fromCharCode(65 + oi)}. {option}
                </div>
              );
            })}
          </div>
          {item.explanation && <p className={styles.explanation}>{item.explanation}</p>}
        </div>
      ))}
    </div>
  );
};

export default ExamReview;
