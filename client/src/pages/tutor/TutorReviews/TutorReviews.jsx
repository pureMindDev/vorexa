import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getTutorById } from '../../../services/tutorService';

const TutorReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?._id) return;
    getTutorById(user._id)
      .then(({ data }) => {
        setReviews(data.reviews);
        setRating(data.tutor.rating);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load reviews.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Reviews</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Average rating: {rating > 0 ? `${rating} ★` : 'No reviews yet'} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
      </p>

      {reviews.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No reviews yet — they'll show up here after students book and review you.</p>
      )}

      {reviews.map((r) => (
        <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.studentName}</span>
            <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
          </div>
          {r.comment && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
};

export default TutorReviews;
