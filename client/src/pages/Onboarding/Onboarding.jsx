import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import { completeOnboarding } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { STUDENT_TYPES, SUBJECTS_BY_TYPE, ACADEMIC_LEVELS_BY_TYPE } from '../../utils/onboardingData';
import styles from './Onboarding.module.scss';

const TOTAL_STEPS = 3;

const Onboarding = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [studentType, setStudentType] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [academicLevel, setAcademicLevel] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSubject = (subject) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const goNext = () => {
    setError('');
    if (step === 1 && !studentType) {
      setError('Select your student type to continue');
      return;
    }
    if (step === 2 && subjects.length === 0) {
      setError('Select at least one subject');
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    if (!academicLevel) {
      setError('Select your academic level to finish');
      return;
    }
    setLoading(true);
    try {
      const { data } = await completeOnboarding({ studentType, subjects, academicLevel });
      setUser((prev) => ({ ...prev, ...data.user }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = { 1: 'Step 1 of 3', 2: 'Step 2 of 3', 3: 'Step 3 of 3' };
  const titles = {
    1: 'What kind of student are you?',
    2: 'Which subjects are you focusing on?',
    3: "What's your current academic level?",
  };

  const subjectOptions = studentType ? SUBJECTS_BY_TYPE[studentType] || [] : [];
  const levelOptions = studentType ? ACADEMIC_LEVELS_BY_TYPE[studentType] || [] : [];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <p className={styles.stepLabel}>{stepLabels[step]}</p>
        <h1 className={styles.title}>{titles[step]}</h1>

        {step === 1 && (
          <div className={styles.grid}>
            {STUDENT_TYPES.map((type) => (
              <div
                key={type.value}
                className={`${styles.card} ${studentType === type.value ? styles['card--selected'] : ''}`}
                onClick={() => setStudentType(type.value)}
              >
                <div className={styles.cardLabel}>{type.label}</div>
                <div className={styles.cardDescription}>{type.description}</div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className={styles.chipGrid}>
            {subjectOptions.map((subject) => (
              <div
                key={subject}
                className={`${styles.chip} ${subjects.includes(subject) ? styles['chip--selected'] : ''}`}
                onClick={() => toggleSubject(subject)}
              >
                {subject}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className={styles.levelList}>
            {levelOptions.map((level) => (
              <div
                key={level}
                className={`${styles.card} ${academicLevel === level ? styles['card--selected'] : ''}`}
                onClick={() => setAcademicLevel(level)}
              >
                <div className={styles.cardLabel}>{level}</div>
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        <div className={styles.actions}>
          {step > 1 ? (
            <button className={styles.backBtn} onClick={goBack}>
              &larr; Back
            </button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <Button onClick={goNext} style={{ width: 'auto', paddingInline: '2rem' }}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={loading} style={{ width: 'auto', paddingInline: '2rem' }}>
              Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
