import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import styles from './ExamResult.module.scss';

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const ExamResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, attemptId, subjects } = location.state || {};

  if (!result) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No result to show.</p>
        <div style={{ maxWidth: '200px', margin: '0 auto' }}>
          <Button onClick={() => navigate('/cbt')}>Back to CBT</Button>
        </div>
      </div>
    );
  }

  const passed = result.score >= 50;

  return (
    <div className={styles.wrapper}>
      <div className={styles.scoreCircle}>
        <span className={styles.scoreValue}>{result.score}%</span>
        <span className={styles.scoreLabel}>{passed ? 'Well done' : 'Keep practicing'}</span>
      </div>

      <h1 className={styles.title}>{subjects?.join(', ')} results</h1>
      <p className={styles.subtitle}>
        You got {result.correctCount} out of {result.totalQuestions} questions correct.
      </p>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatDuration(result.timeTakenSeconds)}</div>
          <div className={styles.statLabel}>Time taken</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>+{result.xpEarned} XP</div>
          <div className={styles.statLabel}>Earned</div>
        </div>
      </div>

      {result.newBadges?.length > 0 && (
        <div style={{
          background: '#F5F3FF', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px',
          padding: '1rem', marginBottom: '2rem',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            New badge{result.newBadges.length > 1 ? 's' : ''} unlocked
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {result.newBadges.map((b) => (
              <div key={b.key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px' }}>{b.icon}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="outline" style={{ width: 'auto', paddingInline: '2rem' }} onClick={() => navigate('/cbt')}>
          Back to CBT
        </Button>
        <Button style={{ width: 'auto', paddingInline: '2rem' }} onClick={() => navigate(`/cbt/review/${attemptId}`)}>
          Review answers
        </Button>
      </div>
    </div>
  );
};

export default ExamResult;
