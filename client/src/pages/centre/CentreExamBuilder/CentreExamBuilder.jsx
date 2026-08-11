import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { getMyCentre, createExam } from '../../../services/centreService';
import styles from './CentreExamBuilder.module.scss';

const emptyQuestion = () => ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });

const CentreExamBuilder = () => {
  const navigate = useNavigate();
  const [centreId, setCentreId] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyCentre()
      .then(({ data }) => setCentreId(data.centre._id))
      .catch(() => setError('Create your centre profile before adding exams.'));
  }, []);

  const updateQuestion = (index, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, oi) => (oi === oIndex ? value : o)) } : q))
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index) => setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give the exam a title.');
      return;
    }
    const invalid = questions.find((q) => !q.questionText.trim() || q.options.some((o) => !o.trim()));
    if (invalid) {
      setError('Every question needs text and all 4 options filled in.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createExam({ centreId, title: title.trim(), subject: subject.trim(), durationMinutes: Number(durationMinutes), questions });
      navigate('/centre/exams');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this exam.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>New Exam</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.metaRow}>
          <input className={styles.input} placeholder="Exam title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={styles.input} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <input
            className={styles.input}
            type="number"
            min="5"
            placeholder="Duration (min)"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span>Question {qIndex + 1}</span>
              {questions.length > 1 && (
                <FiTrash2 size={15} className={styles.deleteIcon} onClick={() => removeQuestion(qIndex)} />
              )}
            </div>
            <input
              className={styles.input}
              placeholder="Question text"
              value={q.questionText}
              onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
            />
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className={styles.optionRow}>
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={q.correctAnswer === oIndex}
                  onChange={() => updateQuestion(qIndex, { correctAnswer: oIndex })}
                />
                <input
                  className={styles.optionInput}
                  placeholder={`Option ${oIndex + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                />
              </div>
            ))}
            <input
              className={styles.input}
              placeholder="Explanation (optional, shown after grading)"
              value={q.explanation}
              onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
            />
          </div>
        ))}

        <button type="button" className={styles.addQuestionBtn} onClick={addQuestion}>
          <FiPlus size={15} /> Add question
        </button>

        {error && <p className={styles.errorText}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Saving...' : 'Save exam (draft)'}
        </button>
      </form>
    </div>
  );
};

export default CentreExamBuilder;
