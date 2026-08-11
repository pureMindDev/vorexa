import { NavLink } from 'react-router-dom';
import { FiHome, FiCalendar, FiUser, FiStar, FiSettings, FiLogOut, FiVideo, FiMessageCircle, FiMail } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from './TutorSidebar.module.scss';

const NAV_ITEMS = [
  { to: '/tutor/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/tutor/bookings', label: 'Bookings', icon: FiCalendar },
  { to: '/tutor/live-classes', label: 'Live Classes', icon: FiVideo },
  { to: '/tutor/feed', label: 'Feed', icon: FiMessageCircle },
  { to: '/tutor/messages', label: 'Messages', icon: FiMail },
  { to: '/tutor/profile', label: 'My Profile', icon: FiUser },
  { to: '/tutor/reviews', label: 'Reviews', icon: FiStar },
  { to: '/tutor/settings', label: 'Settings', icon: FiSettings },
];

const TutorSidebar = () => {
  const { logout } = useAuth();

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>V</div>
          <span className={styles.logo}>Vorexa</span>
        </div>
        <span className={styles.tutorBadge}>TUTOR</span>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles['navItem--active'] : ''}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={logout}>
            <FiLogOut size={17} />
            Log out
          </button>
        </div>
      </aside>

      <nav className={styles.mobileNav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.mobileNavItem} ${isActive ? styles['mobileNavItem--active'] : ''}`}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default TutorSidebar;
