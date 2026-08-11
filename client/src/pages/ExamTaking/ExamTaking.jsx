import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import Button from '../../components/Button/Button';
import { submitExam } from '../../services/cbtService';
import styles from './ExamTaking.module.scss';

const SECONDS_PER_QUESTION = 60;

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ExamTaking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const attempt = location.state?.attempt;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(
    attempt ? attempt.questions.length * SECONDS_PER_QUESTION : 0
  );
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || !attempt) return;
    submittedRef.current = true;
    setSubmitting(true);

    const answerPayload = attempt.questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] ?? null,
    }));

    try {
      const { data } = await submitExam(attempt.attemptId, answerPayload);
      navigate('/cbt/result', { state: { result: data, attemptId: attempt.attemptId, subjects: attempt.subjects } });
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [attempt, answers, navigate]);

  useEffect(() => {
    if (!attempt) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attempt, handleSubmit]);

  if (!attempt) {
    return (
      <div>
        <p style={{ color: 'var(--text-secondary)' }}>
          No active exam found. Go back to CBT and start a new one.
        </p>
        <div style={{ marginTop: '1rem', maxWidth: '200px' }}>
          <Button onClick={() => navigate('/cbt')}>Back to CBT</Button>
        </div>
      </div>
    );
  }

  const question = attempt.questions[current];
  const answeredCount = Object.keys(answers).length;

  const selectOption = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  };

  return (
    <div>
      <div className={styles.header}>
        <span className={styles.progress}>
          {attempt.subjects.join(', ')} &middot; Question {current + 1} of {attempt.questions.length} &middot; {answeredCount} answered
        </span>
        <span className={`${styles.timer} ${timeLeft < 60 ? styles['timer--warning'] : ''}`}>
          <FiClock size={18} /> {formatTime(timeLeft)}
        </span>
      </div>

      <div className={styles.dotRow}>
        {attempt.questions.map((q, i) => (
          <div
            key={q.id}
            className={`${styles.dot} ${answers[q.id] !== undefined ? styles['dot--answered'] : ''} ${i === current ? styles['dot--current'] : ''}`}
            onClick={() => setCurrent(i)}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className={styles.questionCard}>
        {attempt.subjects.length > 1 && (
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {question.subject}
          </p>
        )}
        <p className={styles.questionText}>{question.questionText}</p>
        <div className={styles.options}>
          {question.options.map((option, i) => (
            <div
              key={i}
              className={`${styles.option} ${answers[question.id] === i ? styles['option--selected'] : ''}`}
              onClick={() => selectOption(i)}
            >
              <div className={styles.optionLetter}>{String.fromCharCode(65 + i)}</div>
              <span>{option}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.navRow}>
        <Button
          variant="outline"
          style={{ width: 'auto', paddingInline: '2rem' }}
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
          disabled={current === 0}
        >
          Previous
        </Button>

        {current < attempt.questions.length - 1 ? (
          <Button
            style={{ width: 'auto', paddingInline: '2rem' }}
            onClick={() => setCurrent((c) => Math.min(c + 1, attempt.questions.length - 1))}
          >
            Next
          </Button>
        ) : (
          <Button
            style={{ width: 'auto', paddingInline: '2rem' }}
            onClick={handleSubmit}
            loading={submitting}
          >
            Submit exam
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExamTaking;
