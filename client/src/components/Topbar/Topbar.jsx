import { FiLogOut, FiZap } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import NotificationBell from '../NotificationBell/NotificationBell';
import MessagesBell from '../MessagesBell/MessagesBell';
import styles from './Topbar.module.scss';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up studying';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Topbar = () => {
  const { user, logout } = useAuth();
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
  const firstName = user?.name?.split(' ')[0];
  const streak = user?.streakCount ?? 0;

  return (
    <header className={styles.topbar}>
      <div>
        <h1 className={styles.greeting}>
          {getGreeting()}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className={styles.subline}>
          {streak > 0 ? (
            <>
              <FiZap size={13} className={styles.streakFlame} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
              You're on a {streak}-day streak — keep it going today.
            </>
          ) : (
            "Let's start a study streak today."
          )}
        </p>
      </div>

      <div className={styles.actions}>
        <ThemeToggle />
        <MessagesBell />
        <NotificationBell />
        <button className={styles.iconBtn} onClick={logout} aria-label="Log out">
          <FiLogOut size={18} />
        </button>
        <div className={styles.avatar}>{initial}</div>
      </div>
    </header>
  );
};

export default Topbar;
