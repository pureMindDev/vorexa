import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiStar, FiCheckCircle, FiClock, FiMapPin } from 'react-icons/fi';
import Button from '../../components/Button/Button';
import { getTutorById } from '../../services/tutorService';
import { createBooking } from '../../services/bookingService';
import styles from './TutorProfileDetail.module.scss';

const TutorProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subject, setSubject] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getTutorById(id);
        setTutor(data.tutor);
        setReviews(data.reviews);
        setSubject(data.tutor.subjects[0] || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this tutor.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!subject || !preferredTime.trim()) {
      setError('Subject and preferred time are required');
      return;
    }
    setBooking(true);
    setError('');
    try {
      await createBooking({ tutorId: id, subject, preferredTime, message });
      setBookingSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send booking request.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading tutor...</p>;
  if (!tutor) return <p style={{ color: '#EF4444' }}>{error || 'Tutor not found.'}</p>;

  return (
    <div>
      <span className={styles.back} onClick={() => navigate('/tutors')}>&larr; Back to Tutor Marketplace</span>

      <div className={styles.header}>
        <div className={styles.avatar}>{tutor.name?.charAt(0)?.toUpperCase()}</div>
        <div>
          <div className={styles.name}>
            {tutor.name}
            {tutor.isVerified && <FiCheckCircle size={16} className={styles.verifiedBadge} />}
          </div>
          <div className={styles.rating}>
            {tutor.reviewCount > 0 ? (
              <><FiStar size={13} style={{ verticalAlign: '-2px' }} /> {tutor.rating} ({tutor.reviewCount} review{tutor.reviewCount !== 1 ? 's' : ''})</>
            ) : 'No reviews yet'}
          </div>
          <p className={styles.bio}>{tutor.bio || 'This tutor has not added a bio yet.'}</p>
          <div className={styles.metaRow}>
            <span><FiClock size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{tutor.yearsExperience} yrs experience</span>
            <span><FiMapPin size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{tutor.sessionType}</span>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <div>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Subjects</h2>
            <div className={styles.subjectTags}>
              {tutor.subjects.map((s) => <span key={s} className={styles.subjectTag}>{s}</span>)}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Reviews</h2>
            {reviews.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No reviews yet.</p>
            )}
            {reviews.map((r) => (
              <div key={r.id} className={styles.review}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewAuthor}>{r.studentName}</span>
                  <span className={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={styles.card}>
            <div className={styles.rateDisplay}>₦{tutor.hourlyRate.toLocaleString()}/hr</div>

            {bookingSuccess ? (
              <p style={{ color: '#10B981', fontSize: '0.875rem' }}>
                Booking request sent! You'll see its status in "My bookings" once {tutor.name.split(' ')[0]} responds.
              </p>
            ) : (
              <form onSubmit={handleBook}>
                <div className={styles.bookField}>
                  <label className={styles.bookLabel}>Subject</label>
                  <select className={styles.bookInput} value={subject} onChange={(e) => setSubject(e.target.value)}>
                    {tutor.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.bookField}>
                  <label className={styles.bookLabel}>Preferred time</label>
                  <input
                    className={styles.bookInput}
                    placeholder="e.g. Saturday 4-6pm"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  />
                </div>
                <div className={styles.bookField}>
                  <label className={styles.bookLabel}>Message (optional)</label>
                  <textarea
                    className={styles.bookTextarea}
                    placeholder="What do you need help with?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
                <Button type="submit" loading={booking}>Request booking</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileDetail;
