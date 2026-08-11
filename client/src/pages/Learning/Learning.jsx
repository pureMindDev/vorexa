import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen, FiVideo } from 'react-icons/fi';
import { getCourses } from '../../services/courseService';
import { useCursorList } from '../../hooks/useCursorList';
import styles from './Learning.module.scss';

const FILTERS = ['All', 'In progress', 'Not started', 'Completed'];

const Learning = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  // Catalogue pages stream in on scroll, so the grid stays fast no matter how many
  // courses exist. Client-side filter chips apply to whatever has loaded so far.
  const fetchPage = useCallback(async (cursor) => {
    const { data } = await getCourses({ cursor, limit: 12 });
    return { items: data.courses, nextCursor: data.nextCursor };
  }, []);

  const { items: courses, loading, loadingMore, hasMore, error, sentinelRef } = useCursorList(fetchPage);

  const filtered = courses.filter((c) => {
    if (filter === 'All') return true;
    if (filter === 'In progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'Not started') return c.progress === 0;
    if (filter === 'Completed') return c.progress === 100;
    return true;
  });

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Learning</h1>
        <p className={styles.subtitle}>Courses picked based on your subjects and academic level.</p>
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <div
            key={f}
            className={`${styles.filterChip} ${filter === f ? styles['filterChip--active'] : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </div>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading courses...</p>}
      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {!loading && !error && (
        <div className={styles.grid}>
          {filtered.map((course) => (
            <div key={course._id} className={styles.card} onClick={() => navigate(`/learning/${course._id}`)}>
              <div className={styles.cardBanner} style={{ background: '#2563EB' }}>
                <FiBookOpen size={32} />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardSubject}>{course.subject}</div>
                <div className={styles.cardTitle}>{course.title}</div>
                <div className={styles.cardMeta}>
                  <span><FiVideo size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{course.lessonCount} lessons</span>
                  <span>{course.progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} />
      {loadingMore && <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading more courses…</p>}

      {!loading && !error && filtered.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>
          No courses match this filter yet.
        </p>
      )}
    </div>
  );
};

export default Learning;
