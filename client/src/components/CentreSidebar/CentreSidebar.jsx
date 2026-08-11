import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiBarChart2, FiLogOut, FiVideo, FiMessageCircle, FiMail } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from '../TutorSidebar/TutorSidebar.module.scss';

const NAV_ITEMS = [
  { to: '/centre/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/centre/members', label: 'Members', icon: FiUsers },
  { to: '/centre/live-classes', label: 'Classes', icon: FiVideo },
  { to: '/centre/exams', label: 'Exams', icon: FiFileText },
  { to: '/centre/feed', label: 'Feed', icon: FiMessageCircle },
  { to: '/centre/messages', label: 'Messages', icon: FiMail },
  { to: '/centre/reports', label: 'Reports', icon: FiBarChart2 },
];

const CentreSidebar = () => {
  const { logout } = useAuth();

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>V</div>
          <span className={styles.logo}>Vorexa</span>
        </div>
        <span className={styles.tutorBadge}>CENTRE</span>

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

export default CentreSidebar;
