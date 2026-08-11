import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiAward, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getCourseById } from '../../services/courseService';
import styles from './Certificate.module.scss';

const Certificate = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(0);
  const [completedAt, setCompletedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCourseById(courseId);
        setCourse(data.course);
        setProgress(data.progress);
        setCompletedAt(data.completedAt);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this certificate.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  if (loading) return <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading certificate...</p>;
  if (error) return <p style={{ padding: '2rem', color: '#EF4444' }}>{error}</p>;
  if (!course) return null;

  if (progress < 100) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem' }}>
          Complete all lessons in <strong>{course.title}</strong> to unlock your certificate.
        </p>
        <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/learning/${courseId}`)}>
          &larr; Back to course
        </span>
      </div>
    );
  }

  const issuedDate = completedAt ? new Date(completedAt) : new Date();

  return (
    <div className={styles.page}>
      <div className={styles.backBar}>
        <span className={styles.back} onClick={() => navigate(`/learning/${courseId}`)}>&larr; Back to course</span>
        <button className={styles.downloadBtn} onClick={() => window.print()}>
          <FiDownload size={16} />
          Download / Print
        </button>
      </div>

      <div className={styles.certificate}>
        <div className={styles.innerBorder} />

        <div className={styles.logoRow}>
          <div className={styles.logoMark}>V</div>
          <span className={styles.logoText}>Vorexa</span>
        </div>

        <p className={styles.eyebrow}>Certificate of Completion</p>
        <p className={styles.presentedTo}>This certificate is proudly presented to</p>
        <div className={styles.studentName}>{user?.name || 'Student'}</div>

        <p className={styles.bodyText}>
          for successfully completing the course{' '}
          <span className={styles.courseTitle}>{course.title}</span> in {course.subject},
          demonstrating dedication and commitment to academic excellence on Vorexa.
        </p>

        <div className={styles.footerRow}>
          <div className={styles.footerBlock}>
            <div className={styles.footerLabel}>Date issued</div>
            <div className={styles.footerValue}>
              {issuedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className={styles.seal}>
            <FiAward size={28} />
          </div>

          <div className={styles.footerBlock}>
            <div className={styles.footerLabel}>Issued by</div>
            <div className={styles.footerValue}>Vorexa</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
