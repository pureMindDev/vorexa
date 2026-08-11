import { useState, useEffect } from 'react';
import { getPerformanceReport, getCentrePayments } from '../../../services/centreService';
import styles from './CentreReports.module.scss';

const CentreReports = () => {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: reportData }, { data: paymentData }] = await Promise.all([
          getPerformanceReport(),
          getCentrePayments(),
        ]);
        setStats(reportData);
        setPayments(paymentData);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load reports.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className={styles.loadingText}>Loading...</p>;
  if (error) return <p className={styles.errorText}>{error}</p>;

  return (
    <div>
      <h1 className={styles.title}>Performance Reports</h1>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active students</div>
          <div className={styles.statValue}>{stats.totalStudents}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active tutors</div>
          <div className={styles.statValue}>{stats.totalTutors}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Classes held</div>
          <div className={styles.statValue}>{stats.totalClasses}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Exam attempts</div>
          <div className={styles.statValue}>{stats.totalExamAttempts}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Avg. exam score</div>
          <div className={styles.statValue}>{stats.averageExamScore !== null ? `${stats.averageExamScore}%` : '—'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Attendance records</div>
          <div className={styles.statValue}>{stats.totalAttendanceRecords}</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Payments</h2>
      <p className={styles.note}>
        This is a read-only view of your students' tutor booking payments — Vorexa doesn't yet support the centre
        collecting fees directly through the platform.
      </p>
      <div className={styles.totalPaid}>Total tracked: ₦{payments.totalCollected.toLocaleString()}</div>

      {payments.payments.length === 0 && <p className={styles.emptyState}>No payments recorded yet.</p>}
      {payments.payments.map((p) => (
        <div key={p._id} className={styles.row}>
          <span>{p.studentId?.name} → {p.tutorId?.name}</span>
          <span>₦{p.amount.toLocaleString()} ({p.status})</span>
        </div>
      ))}
    </div>
  );
};

export default CentreReports;
