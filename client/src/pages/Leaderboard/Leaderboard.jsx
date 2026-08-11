import { useState, useEffect } from 'react';
import { FiZap } from 'react-icons/fi';
import { getLeaderboard } from '../../services/userService';
import styles from './Leaderboard.module.scss';

const AVATAR_COLORS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#EF4444'];
const colorFor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getLeaderboard(50);
        setLeaderboard(data.leaderboard);
        setCurrentUserRank(data.currentUserRank);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load the leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading leaderboard...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.subtitle}>Top students by total XP across Vorexa.</p>
      </div>

      {top3.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>
          No XP earned yet — complete a lesson or CBT to appear on the leaderboard.
        </p>
      )}

      {top3.length > 0 && (
        <div className={styles.podium}>
          {top3.map((entry, i) => (
            <div key={entry.id} className={`${styles.podiumCard} ${styles[`podiumCard--${i + 1}`]}`}>
              <div className={styles.medal}>{medals[i]}</div>
              <div className={styles.podiumAvatar} style={{ background: colorFor(entry.name) }}>
                {entry.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className={styles.podiumName}>{entry.name}{entry.isCurrentUser ? ' (You)' : ''}</div>
              <div className={styles.podiumXp}>{entry.xp} XP</div>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className={styles.list}>
          {rest.map((entry) => (
            <div key={entry.id} className={`${styles.row} ${entry.isCurrentUser ? styles['row--me'] : ''}`}>
              <div className={styles.rank}>{entry.rank}</div>
              <div className={styles.avatar}>{entry.name?.charAt(0)?.toUpperCase()}</div>
              <div className={styles.info}>
                <div className={styles.name}>
                  {entry.name}
                  {entry.isCurrentUser && <span className={styles.youTag}>YOU</span>}
                </div>
                <div className={styles.meta}>
                  <FiZap size={11} style={{ verticalAlign: '-1px', marginRight: '3px' }} />
                  {entry.streakCount} day streak
                </div>
              </div>
              <div className={styles.xp}>{entry.xp} XP</div>
            </div>
          ))}
        </div>
      )}

      {currentUserRank && (
        <>
          <div className={styles.divider}><span>Your rank</span></div>
          <div className={styles.list}>
            <div className={`${styles.row} ${styles['row--me']}`}>
              <div className={styles.rank}>{currentUserRank.rank}</div>
              <div className={styles.avatar}>{currentUserRank.name?.charAt(0)?.toUpperCase()}</div>
              <div className={styles.info}>
                <div className={styles.name}>
                  {currentUserRank.name}
                  <span className={styles.youTag}>YOU</span>
                </div>
                <div className={styles.meta}>
                  <FiZap size={11} style={{ verticalAlign: '-1px', marginRight: '3px' }} />
                  {currentUserRank.streakCount} day streak
                </div>
              </div>
              <div className={styles.xp}>{currentUserRank.xp} XP</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
