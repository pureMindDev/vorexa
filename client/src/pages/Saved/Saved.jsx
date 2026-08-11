import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookmark, FiBookOpen, FiFileText } from 'react-icons/fi';
import { getMyBookmarks } from '../../services/bookmarkService';
import styles from './Saved.module.scss';

const Saved = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyBookmarks();
        setBookmarks(data.bookmarks);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your saved items.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const goTo = (b) => {
    if (b.lessonId) navigate(`/learning/${b.courseId}/lesson/${b.lessonId}`);
    else navigate(`/learning/${b.courseId}`);
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Saved</h1>
        <p className={styles.subtitle}>Courses and lessons you've bookmarked for later.</p>
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {!loading && !error && bookmarks.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Nothing saved yet — tap the bookmark icon on any course or lesson to save it here.
        </p>
      )}

      {bookmarks.map((b) => (
        <div key={b.id} className={styles.item} onClick={() => goTo(b)}>
          <div className={styles.thumb}>
            {b.lessonId ? <FiFileText size={18} /> : <FiBookOpen size={18} />}
          </div>
          <div>
            <div className={styles.itemTitle}>{b.lessonTitle || b.courseTitle}</div>
            <div className={styles.itemSub}>
              {b.lessonTitle ? `${b.courseTitle} — ` : ''}{b.subject}
            </div>
          </div>
          <FiBookmark size={14} fill="#2563EB" color="#2563EB" style={{ marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
};

export default Saved;
