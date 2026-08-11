import { useState, useEffect } from 'react';
import { getAchievements, getWeakTopics } from '../../services/userService';
import styles from './Achievements.module.scss';

const Achievements = () => {
  const [data, setData] = useState(null);
  const [weakTopics, setWeakTopics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [achievementsRes, weakTopicsRes] = await Promise.all([getAchievements(), getWeakTopics()]);
        setData(achievementsRes.data);
        setWeakTopics(weakTopicsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load achievements.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading achievements...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;
  if (!data) return null;

  const { level, stats, badges } = data;
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Achievements</h1>
        <p className={styles.subtitle}>Your level, XP progress, and earned badges.</p>
      </div>

      <div className={styles.levelCard}>
        <div className={styles.levelBadge}>
          <span className={styles.levelNumber}>{level.level}</span>
          <span className={styles.levelLabel}>LEVEL</span>
        </div>
        <div className={styles.levelInfo}>
          <div className={styles.levelTitle}>Level {level.level}</div>
          <div className={styles.levelBarTrack}>
            <div className={styles.levelBarFill} style={{ width: `${level.progressPercent}%` }} />
          </div>
          <div className={styles.levelSub}>
            {level.xpIntoLevel} / {level.xpForNextLevel} XP to Level {level.level + 1}
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.xp}</div>
          <div className={styles.statLabel}>Total XP</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.streakCount}</div>
          <div className={styles.statLabel}>Day streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.lessonsCompleted}</div>
          <div className={styles.statLabel}>Lessons done</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.cbtCompleted}</div>
          <div className={styles.statLabel}>CBT attempts</div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Subject Performance</h2>
      {(!weakTopics || !weakTopics.hasData) && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Take a few CBT practice exams to see your accuracy breakdown by subject.
        </p>
      )}
      {weakTopics?.hasData && (
        <div className={styles.card} style={{ marginBottom: '2rem' }}>
          {weakTopics.subjects.map((s) => {
            const color = s.accuracy < 50 ? '#EF4444' : s.accuracy < 75 ? '#F59E0B' : '#10B981';
            return (
              <div key={s.subject} className={styles.subjectRow}>
                <div className={styles.subjectHeader}>
                  <span className={styles.subjectName}>{s.subject}</span>
                  <span className={styles.subjectScore} style={{ color }}>{s.accuracy}%</span>
                </div>
                <div className={styles.subjectBarTrack}>
                  <div className={styles.subjectBarFill} style={{ width: `${s.accuracy}%`, background: color }} />
                </div>
                <div className={styles.subjectMeta}>{s.correct} of {s.total} questions correct</div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className={styles.sectionTitle}>Badges ({earnedCount}/{badges.length})</h2>
      <div className={styles.badgeGrid}>
        {badges.map((badge) => (
          <div key={badge.key} className={`${styles.badgeCard} ${!badge.earned ? styles['badgeCard--locked'] : ''}`}>
            <div className={styles.badgeIcon}>{badge.icon}</div>
            <div className={styles.badgeName}>{badge.name}</div>
            <div className={styles.badgeDescription}>{badge.description}</div>
            {badge.earned && (
              <div className={styles.badgeDate}>
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
