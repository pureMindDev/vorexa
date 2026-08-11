import { useAuth } from '../../context/AuthContext';
import { STUDENT_TYPES } from '../../utils/onboardingData';
import styles from './Profile.module.scss';

const Profile = () => {
  const { user } = useAuth();
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
  const studentTypeLabel = STUDENT_TYPES.find((t) => t.value === user?.studentType)?.label || '—';

  return (
    <div>
      <div className={styles.headerCard}>
        <div className={styles.avatar}>{initial}</div>
        <div>
          <div className={styles.name}>{user?.name || 'Student'}</div>
          <div className={styles.meta}>{user?.email}</div>
          <span className={styles.badge}>{studentTypeLabel}</span>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{user?.xp ?? 0}</div>
          <div className={styles.statLabel}>Total XP</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{user?.streakCount ?? 0}</div>
          <div className={styles.statLabel}>Day streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{user?.subjects?.length ?? 0}</div>
          <div className={styles.statLabel}>Subjects</div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Academic profile</h2>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Student type</span>
          <span className={styles.rowValue}>{studentTypeLabel}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Academic level</span>
          <span className={styles.rowValue}>{user?.academicLevel || '—'}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Subjects</h2>
        <div className={styles.subjectTags}>
          {user?.subjects?.length ? (
            user.subjects.map((s) => (
              <span key={s} className={styles.subjectTag}>{s}</span>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No subjects selected yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
