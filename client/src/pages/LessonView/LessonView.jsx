import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlayCircle, FiClock, FiDownload, FiFileText, FiBookmark } from 'react-icons/fi';
import Button from '../../components/Button/Button';
import { getCourseById, completeLesson } from '../../services/courseService';
import { toggleBookmark, getMyBookmarks } from '../../services/bookmarkService';
import styles from './LessonView.module.scss';

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getCourseById(courseId);
      setCourse(data.course);
      setLessons(data.lessons);

      const { data: bookmarksData } = await getMyBookmarks();
      setBookmarked(bookmarksData.bookmarks.some((b) => b.lessonId === lessonId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this lesson.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading lesson...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;
  if (!course) return null;

  const currentIndex = lessons.findIndex((l) => l._id === lessonId);
  const lesson = lessons[currentIndex];

  if (!lesson) return <p style={{ color: '#EF4444' }}>Lesson not found in this course.</p>;

  const prevLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];

  const handleComplete = async () => {
    if (lesson.completed) {
      if (nextLesson) navigate(`/learning/${courseId}/lesson/${nextLesson._id}`);
      return;
    }
    setCompleting(true);
    try {
      const { data } = await completeLesson(courseId, lesson._id);
      const updatedLessons = lessons.map((l) => (l._id === lesson._id ? { ...l, completed: true } : l));
      setLessons(updatedLessons);

      const allComplete = updatedLessons.every((l) => l.completed);

      if (!data.alreadyCompleted) {
        const badgeText = data.newBadges?.length
          ? ` — 🏅 ${data.newBadges.map((b) => b.name).join(', ')} unlocked!`
          : '';
        setToast(`+${data.xpEarned} XP earned${badgeText}`);
        setTimeout(() => setToast(''), 3500);
      }

      if (allComplete) {
        setTimeout(() => navigate(`/certificate/${courseId}`), 1200);
      } else if (nextLesson) {
        setTimeout(() => navigate(`/learning/${courseId}/lesson/${nextLesson._id}`), 600);
      }
    } catch {
      setToast('Could not mark lesson complete');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setCompleting(false);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const { data } = await toggleBookmark(courseId, lessonId);
      setBookmarked(data.bookmarked);
    } catch {
      // silent — non-critical action
    }
  };

  const downloadNotes = () => {
    const blob = new Blob([`${lesson.title}\n${course.title} — ${course.subject}\n\n${lesson.notes || ''}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lesson.title.replace(/[^a-z0-9]/gi, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <span className={styles.back} onClick={() => navigate(`/learning/${courseId}`)}>
        &larr; Back to {course.title}
      </span>

      <div className={styles.progressDots}>
        {lessons.map((l, i) => (
          <div
            key={l._id}
            className={`${styles.dot} ${i === currentIndex ? styles['dot--current'] : ''} ${l.completed ? styles['dot--done'] : ''}`}
          />
        ))}
      </div>

      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <div className={styles.meta}>{course.subject} &middot; Lesson {currentIndex + 1} of {lessons.length}</div>
          <h1 className={styles.title}>{lesson.title}</h1>
          <span className={styles.duration}>
            <FiClock size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            {lesson.durationMinutes} min read
          </span>
        </div>
        <button
          onClick={handleToggleBookmark}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            border: '1px solid var(--border)', background: bookmarked ? '#EFF6FF' : 'transparent',
            color: bookmarked ? '#2563EB' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Bookmark lesson"
        >
          <FiBookmark size={17} fill={bookmarked ? '#2563EB' : 'none'} />
        </button>
      </div>

      {lesson.videoUrl ? (
        <video src={lesson.videoUrl} controls style={{ width: '100%', borderRadius: '16px', marginBottom: '1.5rem' }} />
      ) : (
        <div className={styles.videoPlaceholder}>
          <FiPlayCircle size={32} />
          <span style={{ fontSize: '0.8rem' }}>Video coming soon — read the notes below for now</span>
        </div>
      )}

      <div className={styles.content}>
        {lesson.notes || 'No written content has been added for this lesson yet.'}
      </div>

      <div className={styles.resourceRow}>
        {lesson.pdfUrl ? (
          <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.resourceBtn}>
            <FiFileText size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
            View PDF
          </a>
        ) : (
          <span className={styles.resourceHint}>No PDF attached to this lesson yet</span>
        )}
        <button className={styles.resourceBtn} onClick={downloadNotes}>
          <FiDownload size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
          Download notes
        </button>
      </div>

      <div className={styles.navRow}>
        <Button
          variant="outline"
          style={{ width: 'auto', paddingInline: '2rem' }}
          onClick={() => prevLesson && navigate(`/learning/${courseId}/lesson/${prevLesson._id}`)}
          disabled={!prevLesson}
        >
          Previous lesson
        </Button>

        <Button
          style={{ width: 'auto', paddingInline: '2rem' }}
          onClick={handleComplete}
          loading={completing}
        >
          {lesson.completed
            ? (nextLesson ? 'Next lesson' : 'Completed')
            : 'Mark complete & continue'}
        </Button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#F8FAFC', padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default LessonView;
