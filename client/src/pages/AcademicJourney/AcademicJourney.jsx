import { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  updateDreamGoal, getExamProgress,
  createAdmission, getAdmissions, updateAdmission, deleteAdmission,
  createGpaRecord, getGpaRecords, deleteGpaRecord,
} from '../../services/academicService';
import styles from './AcademicJourney.module.scss';

const EXAM_TYPES = ['JAMB', 'WAEC', 'NECO', 'Post-UTME'];
const STATUS_OPTIONS = ['pending', 'applied', 'admitted', 'rejected'];

const AcademicJourney = () => {
  const { user } = useAuth();
  const isUniversityStudent = user?.studentType === 'university' || user?.studentType === 'polytechnic';

  const [dreamUniversity, setDreamUniversity] = useState(user?.dreamUniversity || '');
  const [dreamCourse, setDreamCourse] = useState(user?.dreamCourse || '');
  const [savingDream, setSavingDream] = useState(false);

  const [progress, setProgress] = useState([]);

  const [admissions, setAdmissions] = useState([]);
  const [uniName, setUniName] = useState('');
  const [uniCourse, setUniCourse] = useState('');

  const [gpaRecords, setGpaRecords] = useState([]);
  const [cgpa, setCgpa] = useState(null);
  const [semesterLabel, setSemesterLabel] = useState('');
  const [gpaValue, setGpaValue] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    getExamProgress().then(({ data }) => setProgress(data.progress)).catch(() => {});
    getAdmissions().then(({ data }) => setAdmissions(data.admissions)).catch(() => {});
    if (isUniversityStudent) {
      getGpaRecords().then(({ data }) => { setGpaRecords(data.records); setCgpa(data.cgpa); }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveDream = async () => {
    setSavingDream(true);
    try {
      await updateDreamGoal({ dreamUniversity, dreamCourse });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save.');
    } finally {
      setSavingDream(false);
    }
  };

  const handleAddAdmission = async (e) => {
    e.preventDefault();
    if (!uniName.trim() || !uniCourse.trim()) return;
    try {
      const { data } = await createAdmission({ universityName: uniName, course: uniCourse });
      setAdmissions((prev) => [data.admission, ...prev]);
      setUniName('');
      setUniCourse('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add application.');
    }
  };

  const handleStatusChange = async (id, status) => {
    setAdmissions((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    try {
      await updateAdmission(id, { status });
    } catch {
      // silent
    }
  };

  const handleDeleteAdmission = async (id) => {
    setAdmissions((prev) => prev.filter((a) => a._id !== id));
    try {
      await deleteAdmission(id);
    } catch {
      // silent
    }
  };

  const handleAddGpa = async (e) => {
    e.preventDefault();
    if (!semesterLabel.trim() || !gpaValue) return;
    try {
      const { data } = await createGpaRecord({ semesterLabel, gpa: Number(gpaValue) });
      const updated = [...gpaRecords, data.record];
      setGpaRecords(updated);
      setCgpa(Math.round((updated.reduce((s, r) => s + r.gpa, 0) / updated.length) * 100) / 100);
      setSemesterLabel('');
      setGpaValue('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add GPA record.');
    }
  };

  const handleDeleteGpa = async (id) => {
    const updated = gpaRecords.filter((r) => r._id !== id);
    setGpaRecords(updated);
    setCgpa(updated.length > 0 ? Math.round((updated.reduce((s, r) => s + r.gpa, 0) / updated.length) * 100) / 100 : null);
    try {
      await deleteGpaRecord(id);
    } catch {
      // silent
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Academic Journey</h1>
        <p className={styles.subtitle}>Track your goal, exam readiness, and admission progress.</p>
      </div>

      <div className={styles.dreamCard}>
        <div className={styles.dreamLabel}>Your goal</div>
        <div className={styles.dreamRow}>
          <div className={styles.dreamField}>
            <label className={styles.dreamFieldLabel}>Dream university</label>
            <input
              className={styles.dreamInput}
              placeholder="e.g. University of Lagos"
              value={dreamUniversity}
              onChange={(e) => setDreamUniversity(e.target.value)}
            />
          </div>
          <div className={styles.dreamField}>
            <label className={styles.dreamFieldLabel}>Dream course</label>
            <input
              className={styles.dreamInput}
              placeholder="e.g. Computer Science"
              value={dreamCourse}
              onChange={(e) => setDreamCourse(e.target.value)}
            />
          </div>
          <button className={styles.dreamSaveBtn} onClick={handleSaveDream} disabled={savingDream}>
            {savingDream ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Exam readiness</h2>
        <div className={styles.progressGrid}>
          {EXAM_TYPES.map((type) => {
            const p = progress.find((x) => x.examType === type);
            return (
              <div key={type} className={styles.progressCard}>
                <div className={styles.progressExamType}>{type}</div>
                <div className={styles.progressScore}>{p ? `${p.averageScore}%` : '—'}</div>
                <div className={styles.progressMeta}>{p ? `${p.attemptsCount} attempts` : 'No attempts yet'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Admission tracker</h2>
        <form className={styles.form} onSubmit={handleAddAdmission}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>University</label>
              <input className={styles.input} placeholder="e.g. University of Ibadan" value={uniName} onChange={(e) => setUniName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Course</label>
              <input className={styles.input} placeholder="e.g. Medicine" value={uniCourse} onChange={(e) => setUniCourse(e.target.value)} />
            </div>
            <button className={styles.addBtn} type="submit">Add</button>
          </div>
        </form>

        {admissions.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No applications tracked yet.</p>
        )}
        {admissions.map((a) => (
          <div key={a._id} className={styles.listItem}>
            <div className={styles.listInfo}>
              <div className={styles.listTitle}>{a.universityName}</div>
              <div className={styles.listMeta}>{a.course}</div>
            </div>
            <select
              className={`${styles.statusSelect} ${styles[`statusSelect--${a.status}`]}`}
              value={a.status}
              onChange={(e) => handleStatusChange(a._id, e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className={styles.deleteBtn} onClick={() => handleDeleteAdmission(a._id)} aria-label="Delete application">
              <FiTrash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {isUniversityStudent && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>GPA tracker</h2>
          {cgpa !== null && <div className={styles.cgpaBadge}>CGPA: {cgpa}</div>}

          <form className={styles.form} onSubmit={handleAddGpa}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Semester</label>
                <input className={styles.input} placeholder="e.g. 200 Level, First Semester" value={semesterLabel} onChange={(e) => setSemesterLabel(e.target.value)} />
              </div>
              <div className={styles.narrowField}>
                <label className={styles.label}>GPA</label>
                <input type="number" step="0.01" min="0" max="5" className={styles.input} placeholder="e.g. 4.25" value={gpaValue} onChange={(e) => setGpaValue(e.target.value)} />
              </div>
              <button className={styles.addBtn} type="submit">Add</button>
            </div>
          </form>

          {gpaRecords.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No GPA records yet.</p>
          )}
          {gpaRecords.map((r) => (
            <div key={r._id} className={styles.listItem}>
              <div className={styles.listInfo}>
                <div className={styles.listTitle}>{r.semesterLabel}</div>
              </div>
              <div className={styles.listTitle}>{r.gpa}</div>
              <button className={styles.deleteBtn} onClick={() => handleDeleteGpa(r._id)} aria-label="Delete record">
                <FiTrash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademicJourney;
