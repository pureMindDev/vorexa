import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHelpCircle, FiCheck } from 'react-icons/fi';
import Button from '../../components/Button/Button';
import { getSubjects, startExam, getResults } from '../../services/cbtService';
import { SUBJECTS_BY_EXAM_TYPE } from '../../utils/cbtData';
import styles from './CBT.module.scss';

const EXAM_TYPES = ['JAMB', 'WAEC', 'NECO', 'Post-UTME'];
const MAX_SUBJECTS = 4;

const CBT = () => {
  const navigate = useNavigate();
  const [examType, setExamType] = useState('JAMB');
  const [subjects, setSubjects] = useState([]); // full roster merged with real counts
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setSelected([]);
      try {
        const [subjectsRes, resultsRes] = await Promise.all([
          getSubjects(examType),
          getResults(),
        ]);

        // Merge the full canonical subject roster with real question counts from the backend.
        // Subjects with no questions yet still show up, just disabled — so the exam feels complete
        // instead of silently hiding subjects the student expects to see.
        const countMap = new Map(subjectsRes.data.subjects.map((s) => [s.subject, s.questionCount]));
        const roster = SUBJECTS_BY_EXAM_TYPE[examType] || [];
        const merged = roster.map((subject) => ({
          subject,
          questionCount: countMap.get(subject) || 0,
        }));

        setSubjects(merged);
        setResults(resultsRes.data.results);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load CBT data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examType]);

  const toggleSubject = (subject, available) => {
    if (!available) return;
    setSelected((prev) => {
      if (prev.includes(subject)) {
        return prev.filter((s) => s !== subject);
      }
      if (prev.length >= MAX_SUBJECTS) {
        setError(`You can only select up to ${MAX_SUBJECTS} subjects at once`);
        setTimeout(() => setError(''), 2500);
        return prev;
      }
      return [...prev, subject];
    });
  };

  const handleStart = async () => {
    if (selected.length === 0) return;
    setStarting(true);
    setError('');
    try {
      const { data } = await startExam(examType, selected, 10);
      navigate('/cbt/exam', { state: { attempt: data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start exam.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>CBT Practice</h1>
        <p className={styles.subtitle}>Timed practice exams to get you exam-ready.</p>
      </div>

      <div className={styles.examTypeGrid}>
        {EXAM_TYPES.map((type) => (
          <div
            key={type}
            className={`${styles.examTypeCard} ${examType === type ? styles['examTypeCard--active'] : ''}`}
            onClick={() => setExamType(type)}
          >
            <div className={styles.examTypeLabel}>{type}</div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Subjects</h2>
        <p className={styles.hint}>
          Pick 1 subject to practice solo, or up to {MAX_SUBJECTS} to simulate a full {examType} sitting.
          Greyed-out subjects don't have questions loaded yet.
        </p>

        {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading subjects...</p>}

        {!loading && (
          <>
            {selected.length > 0 && (
              <div className={styles.selectionBar}>
                <span className={styles.selectionText}>
                  <strong>{selected.length}</strong> of {MAX_SUBJECTS} subjects selected
                </span>
                <Button
                  style={{ width: 'auto', paddingInline: '2rem' }}
                  onClick={handleStart}
                  loading={starting}
                >
                  Start exam
                </Button>
              </div>
            )}

            <div className={styles.subjectGrid}>
              {subjects.map((s) => {
                const isSelected = selected.includes(s.subject);
                const available = s.questionCount > 0;
                return (
                  <div
                    key={s.subject}
                    className={`${styles.subjectCard} ${isSelected ? styles['subjectCard--selected'] : ''} ${!available ? styles['subjectCard--disabled'] : ''}`}
                    onClick={() => toggleSubject(s.subject, available)}
                  >
                    <div className={styles.subjectInfo}>
                      <div className={styles.subjectName}>{s.subject}</div>
                      <div className={styles.subjectMeta}>
                        <FiHelpCircle size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                        {available ? `${s.questionCount} questions available` : 'No questions yet'}
                      </div>
                    </div>
                    {available && (
                      <div className={`${styles.checkbox} ${isSelected ? styles['checkbox--checked'] : ''}`}>
                        {isSelected && <FiCheck size={14} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent results</h2>
        {results.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No exams taken yet.</p>
        )}
        {results.map((r) => (
          <div key={r._id} className={styles.resultsCard}>
            <div className={styles.subjectInfo}>
              <div className={styles.subjectName}>{r.subjects?.join(', ')}</div>
              <div className={styles.subjectMeta}>{new Date(r.submittedAt).toLocaleDateString()}</div>
            </div>
            <div className={styles.resultScore}>{r.score}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CBT;
