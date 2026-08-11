import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiAward, FiStar, FiTrendingUp } from 'react-icons/fi';
import { getDashboardStats } from '../../../services/tutorService';
import styles from './TutorDashboard.module.scss';

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
  if (!stats) return null;

  return (
    <div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--amber']}`}><FiClock size={18} /></div>
          <div className={styles.statValue}>{stats.pendingCount}</div>
          <div className={styles.statLabel}>Pending requests</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><FiAward size={18} /></div>
          <div className={styles.statValue}>{stats.completedCount}</div>
          <div className={styles.statLabel}>Sessions completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--purple']}`}><FiStar size={18} /></div>
          <div className={styles.statValue}>{stats.rating || '—'}</div>
          <div className={styles.statLabel}>{stats.reviewCount} review{stats.reviewCount !== 1 ? 's' : ''}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><FiTrendingUp size={18} /></div>
          <div className={styles.statValue}>₦{stats.totalEarnings.toLocaleString()}</div>
          <div className={styles.statLabel}>Total earnings ({stats.paidSessionsCount} paid session{stats.paidSessionsCount !== 1 ? 's' : ''})</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Upcoming sessions</h2>
          <span className={styles.link} onClick={() => navigate('/tutor/bookings')}>View all bookings</span>
        </div>
        {stats.pendingCount > 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            You have {stats.pendingCount} pending request{stats.pendingCount !== 1 ? 's' : ''} waiting for a response.
          </p>
        )}
        {stats.upcomingBookings.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No upcoming sessions yet.</p>
        )}
        {stats.upcomingBookings.map((b) => (
          <div key={b.id} className={styles.bookingItem}>
            <div className={styles.bookingAvatar}>{b.studentName?.charAt(0)?.toUpperCase()}</div>
            <div>
              <div className={styles.bookingTitle}>{b.subject} with {b.studentName}</div>
              <div className={styles.bookingMeta}>{b.preferredTime} · ₦{b.amount?.toLocaleString()} {b.isPaid ? '· Paid' : '· Awaiting payment'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorDashboard;
