import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import { getTutors } from '../../services/tutorService';
import styles from './TutorMarketplace.module.scss';

const SUBJECTS = ['All', 'English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Government', 'Economics'];

const TutorMarketplace = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('All');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getTutors(subject === 'All' ? undefined : subject);
        setTutors(data.tutors);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load tutors.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subject]);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Find a Tutor</h1>
          <p className={styles.subtitle}>Book one-on-one help from tutors in your subjects.</p>
        </div>
        <div className={styles.actionRow}>
          <button className={styles.bookingsBtn} onClick={() => navigate('/bookings')}>
            <FiCalendar size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
            My bookings
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        {SUBJECTS.map((s) => (
          <div
            key={s}
            className={`${styles.filterChip} ${subject === s ? styles['filterChip--active'] : ''}`}
            onClick={() => setSubject(s)}
          >
            {s}
          </div>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading tutors...</p>}
      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {!loading && !error && tutors.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>
          No tutors found for this subject yet — check back soon, or become one yourself.
        </p>
      )}

      <div className={styles.grid}>
        {tutors.map((tutor) => (
          <div key={tutor.id} className={styles.card} onClick={() => navigate(`/tutors/${tutor.id}`)}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{tutor.name?.charAt(0)?.toUpperCase()}</div>
              <div>
                <div className={styles.name}>
                  {tutor.name}
                  {tutor.isVerified && <FiCheckCircle size={14} className={styles.verifiedBadge} />}
                </div>
                {tutor.reviewCount > 0 ? (
                  <div className={styles.rating}>
                    <FiStar size={11} style={{ verticalAlign: '-1px' }} /> {tutor.rating} ({tutor.reviewCount})
                  </div>
                ) : (
                  <div className={styles.rating} style={{ color: 'var(--text-secondary)' }}>No reviews yet</div>
                )}
              </div>
            </div>

            <p className={styles.bio}>{tutor.bio || 'No bio added yet.'}</p>

            <div className={styles.subjectTags}>
              {tutor.subjects.slice(0, 3).map((s) => <span key={s} className={styles.subjectTag}>{s}</span>)}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.rate}>₦{tutor.hourlyRate.toLocaleString()}/hr</span>
              <span className={styles.sessionType}>{tutor.sessionType}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorMarketplace;
