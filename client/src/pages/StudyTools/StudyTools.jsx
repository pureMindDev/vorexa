import { useState } from 'react';
import { generateQuiz, generateFlashcards, summarizeNotes, getEssayFeedback, generateRevisionPlan } from '../../services/aiService';
import styles from './StudyTools.module.scss';

const TABS = [
  { key: 'quiz', label: 'Quiz Generator' },
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'summary', label: 'Notes Summary' },
  { key: 'essay', label: 'Essay Feedback' },
  { key: 'plan', label: 'Revision Planner' },
];

const StudyTools = () => {
  const [tab, setTab] = useState('quiz');

  // Quiz / Flashcards state
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState({});

  // Summary / Essay state
  const [longText, setLongText] = useState('');
  const [textResult, setTextResult] = useState('');

  // Revision plan state
  const [daysUntilExam, setDaysUntilExam] = useState(7);
  const [plan, setPlan] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetResults = () => {
    setQuestions([]);
    setAnswers({});
    setCards([]);
    setFlipped({});
    setTextResult('');
    setPlan([]);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    if ((tab === 'quiz' || tab === 'flashcards') && !topic.trim()) {
      setError('Enter a topic to generate from');
      return;
    }
    if ((tab === 'summary' || tab === 'essay') && longText.trim().length < 20) {
      setError('Paste more text — at least a few sentences');
      return;
    }

    setLoading(true);
    resetResults();

    try {
      if (tab === 'quiz') {
        const { data } = await generateQuiz(topic.trim(), null, count);
        setQuestions(data.questions);
      } else if (tab === 'flashcards') {
        const { data } = await generateFlashcards(topic.trim(), null, count);
        setCards(data.cards);
      } else if (tab === 'summary') {
        const { data } = await summarizeNotes(longText.trim());
        setTextResult(data.summary);
      } else if (tab === 'essay') {
        const { data } = await getEssayFeedback(longText.trim(), null);
        setTextResult(data.feedback);
      } else if (tab === 'plan') {
        const { data } = await generateRevisionPlan(daysUntilExam);
        setPlan(data.plan);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isTextTab = tab === 'summary' || tab === 'essay';
  const isPlanTab = tab === 'plan';

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Study Tools</h1>
        <p className={styles.subtitle}>Generate quizzes, flashcards, summaries, and essay feedback — instantly.</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <div
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles['tab--active'] : ''}`}
            onClick={() => { setTab(t.key); setError(''); resetResults(); }}
          >
            {t.label}
          </div>
        ))}
      </div>

      <form className={styles.form} onSubmit={handleGenerate}>
        {isPlanTab ? (
          <div className={styles.formRow}>
            <div className={`${styles.field} ${styles.countField}`} style={{ width: '160px' }}>
              <label className={styles.label}>Days until exam</label>
              <input
                type="number"
                className={styles.input}
                min={3}
                max={21}
                value={daysUntilExam}
                onChange={(e) => setDaysUntilExam(e.target.value)}
              />
            </div>
            <button className={styles.generateBtn} type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate plan'}
            </button>
          </div>
        ) : isTextTab ? (
          <>
            <label className={styles.label}>
              {tab === 'summary' ? 'Paste your notes' : 'Paste your essay'}
            </label>
            <textarea
              className={styles.input}
              style={{ minHeight: '160px', resize: 'vertical', width: '100%', marginBottom: '1rem' }}
              placeholder={tab === 'summary' ? 'Paste the notes you want summarized...' : 'Paste your essay for feedback...'}
              value={longText}
              onChange={(e) => setLongText(e.target.value)}
            />
            <button className={styles.generateBtn} type="submit" disabled={loading}>
              {loading ? 'Generating...' : tab === 'summary' ? 'Summarize' : 'Get feedback'}
            </button>
          </>
        ) : (
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Topic</label>
              <input
                className={styles.input}
                placeholder={tab === 'quiz' ? "e.g. Newton's Laws of Motion" : 'e.g. Periodic Table Trends'}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className={`${styles.field} ${styles.countField}`}>
              <label className={styles.label}>{tab === 'quiz' ? 'Questions' : 'Cards'}</label>
              <input
                type="number"
                className={styles.input}
                min={tab === 'quiz' ? 3 : 4}
                max={tab === 'quiz' ? 10 : 15}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <button className={styles.generateBtn} type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        )}
      </form>

      {error && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>}

      {tab === 'quiz' && questions.length > 0 && (
        <div>
          {questions.map((q, qi) => (
            <div key={qi} className={styles.quizCard}>
              <p className={styles.quizQuestion}>{qi + 1}. {q.question}</p>
              <div className={styles.quizOptions}>
                {q.options.map((opt, oi) => {
                  const selected = answers[qi];
                  let cls = styles.quizOption;
                  if (selected !== undefined) {
                    if (oi === q.correctAnswer) cls += ` ${styles['quizOption--correct']}`;
                    else if (oi === selected) cls += ` ${styles['quizOption--wrong']}`;
                  }
                  return (
                    <div
                      key={oi}
                      className={cls}
                      onClick={() => selected === undefined && setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </div>
                  );
                })}
              </div>
              {answers[qi] !== undefined && q.explanation && (
                <p className={styles.explanation}>{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'flashcards' && cards.length > 0 && (
        <div>
          <p className={styles.hint}>Tap a card to flip it.</p>
          <div className={styles.flashcardGrid}>
            {cards.map((card, i) => (
              <div key={i} className={styles.flashcard} onClick={() => setFlipped((prev) => ({ ...prev, [i]: !prev[i] }))}>
                <div className={`${styles.flashcardInner} ${flipped[i] ? styles['flashcardInner--flipped'] : ''}`}>
                  <div className={`${styles.flashcardFace} ${styles.flashcardFront}`}>{card.front}</div>
                  <div className={`${styles.flashcardFace} ${styles.flashcardBack}`}>{card.back}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPlanTab && plan.length > 0 && (
        <div>
          {plan.map((day) => (
            <div key={day.day} className={styles.planDay}>
              <div className={styles.dayBadge}>
                <span className={styles.dayNumber}>{day.day}</span>
                <span className={styles.dayLabel}>DAY</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.dayFocus}>
                  {day.focusSubjects.map((s) => <span key={s} className={styles.focusTag}>{s}</span>)}
                </div>
                <div className={styles.taskList}>
                  {day.tasks.map((task, i) => <div key={i} className={styles.taskItem}>{task}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isTextTab && textResult && (
        <div className={styles.quizCard} style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
          {textResult}
        </div>
      )}
    </div>
  );
};

export default StudyTools;
