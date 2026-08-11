import { NavLink } from 'react-router-dom';
import { FiGrid, FiUsers, FiCheckCircle, FiCreditCard, FiFlag, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminSidebar.module.scss';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/tutors', label: 'Tutor Verification', icon: FiCheckCircle },
  { to: '/admin/payments', label: 'Payments', icon: FiCreditCard },
  { to: '/admin/moderation', label: 'Moderation', icon: FiFlag },
  { to: '/admin/support', label: 'Support Tickets', icon: FiHelpCircle },
];

const AdminSidebar = () => {
  const { logout } = useAuth();

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>V</div>
          <span className={styles.logo}>Vorexa</span>
        </div>
        <span className={styles.adminBadge}>ADMIN</span>

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
        {NAV_ITEMS.slice(0, 5).map(({ to, label, icon: Icon }) => (
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

export default AdminSidebar;
