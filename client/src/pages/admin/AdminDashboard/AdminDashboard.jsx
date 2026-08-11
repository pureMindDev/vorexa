import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../../../services/adminService';
import styles from '../adminShared.module.scss';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load dashboard stats.');
      }
    })();
  }, []);

  if (error) return <p className={styles.errorText}>{error}</p>;
  if (!stats) return <p className={styles.loadingText}>Loading...</p>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Students', value: stats.totalStudents },
    { label: 'Tutors', value: stats.totalTutors },
    { label: 'New This Week', value: stats.newUsersThisWeek },
    { label: 'Courses', value: stats.totalCourses },
    { label: 'CBT Attempts Today', value: stats.cbtAttemptsToday },
    { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}` },
    {
      label: 'Pending Tutor Verifications',
      value: stats.pendingTutorVerifications,
      alert: stats.pendingTutorVerifications > 0,
      onClick: () => navigate('/admin/tutors'),
    },
    {
      label: 'Pending Reports',
      value: stats.pendingReports,
      alert: stats.pendingReports > 0,
      onClick: () => navigate('/admin/moderation'),
    },
    {
      label: 'Open Support Tickets',
      value: stats.openTickets,
      alert: stats.openTickets > 0,
      onClick: () => navigate('/admin/support'),
    },
  ];

  return (
    <div>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <div className={styles.statGrid}>
        {cards.map((c) => (
          <div
            key={c.label}
            className={styles.statCard}
            style={c.onClick ? { cursor: 'pointer' } : undefined}
            onClick={c.onClick}
          >
            <div className={styles.statLabel}>{c.label}</div>
            <div className={`${styles.statValue} ${c.alert ? styles['statValue--alert'] : ''}`}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
