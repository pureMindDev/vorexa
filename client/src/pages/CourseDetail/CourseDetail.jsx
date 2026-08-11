import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheck, FiClock, FiPlay, FiAward, FiBookmark } from 'react-icons/fi';
import { getCourseById } from '../../services/courseService';
import { toggleBookmark, getMyBookmarks } from '../../services/bookmarkService';
import styles from './CourseDetail.module.scss';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getCourseById(id);
        setCourse(data.course);
        setLessons(data.lessons);
        setProgress(data.progress);

        const { data: bookmarksData } = await getMyBookmarks();
        setBookmarked(bookmarksData.bookmarks.some((b) => b.courseId === id && !b.lessonId));
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this course.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading course...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;
  if (!course) return null;

  const handleToggleBookmark = async () => {
    try {
      const { data } = await toggleBookmark(id);
      setBookmarked(data.bookmarked);
    } catch {
      // silent — non-critical action
    }
  };

  return (
    <div>
      <span className={styles.back} onClick={() => navigate('/learning')}>&larr; Back to Learning</span>

      <div className={styles.header}>
        <div>
          <div className={styles.subject}>{course.subject}</div>
          <h1 className={styles.title}>{course.title}</h1>
          <p className={styles.description}>{course.description}</p>
        </div>
        <button
          onClick={handleToggleBookmark}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            border: '1px solid var(--border)', background: bookmarked ? '#EFF6FF' : 'transparent',
            color: bookmarked ? '#2563EB' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Bookmark course"
        >
          <FiBookmark size={17} fill={bookmarked ? '#2563EB' : 'none'} />
        </button>
      </div>

      {progress === 100 && (
        <div className={styles.certificateBanner} onClick={() => navigate(`/certificate/${id}`)}>
          <div className={styles.certificateIcon}><FiAward size={22} /></div>
          <div>
            <div className={styles.certificateTitle}>Course completed!</div>
            <div className={styles.certificateSub}>Tap to view and download your certificate</div>
          </div>
        </div>
      )}

      <div className={styles.lessonList}>
        {lessons.map((lesson, index) => (
          <div
            key={lesson._id}
            className={styles.lessonCard}
            onClick={() => navigate(`/learning/${id}/lesson/${lesson._id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.lessonInfo}>
              <div className={`${styles.lessonNumber} ${lesson.completed ? styles['lessonNumber--completed'] : ''}`}>
                {lesson.completed ? <FiCheck size={14} /> : index + 1}
              </div>
              <div>
                <div className={styles.lessonTitle}>{lesson.title}</div>
                <div className={styles.lessonMeta}>
                  <FiClock size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  {lesson.durationMinutes} min
                </div>
              </div>
            </div>

            <div className={`${styles.completeBtn} ${lesson.completed ? styles['completeBtn--done'] : ''}`}>
              {lesson.completed ? 'Completed' : (
                <>
                  <FiPlay size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  Start
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseDetail;
