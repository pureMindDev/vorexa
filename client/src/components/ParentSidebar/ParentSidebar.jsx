import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from '../TutorSidebar/TutorSidebar.module.scss';

const NAV_ITEMS = [
  { to: '/parent/dashboard', label: 'My Children', icon: FiHome },
  { to: '/parent/link-child', label: 'Link a Child', icon: FiUsers },
];

const ParentSidebar = () => {
  const { logout } = useAuth();

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>V</div>
          <span className={styles.logo}>Vorexa</span>
        </div>
        <span className={styles.tutorBadge}>PARENT</span>

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

export default ParentSidebar;
