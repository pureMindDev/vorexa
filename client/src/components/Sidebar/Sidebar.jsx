import { NavLink } from 'react-router-dom';
import {
  FiHome, FiBookOpen, FiClock, FiMessageCircle, FiUser, FiSettings,
  FiUsers, FiShoppingBag, FiAward, FiStar, FiZap, FiBookmark, FiCheckSquare, FiMail, FiTarget, FiBriefcase, FiCalendar, FiCreditCard, FiShield, FiVideo,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { upgradeWhatsAppUrl } from '../../utils/upgrade';
import styles from './Sidebar.module.scss';

const NAV_GROUPS = [
  {
    label: 'Learning',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: FiHome },
      { to: '/learning', label: 'Learning', icon: FiBookOpen },
      { to: '/cbt', label: 'CBT', icon: FiClock },
      { to: '/ai-tutor', label: 'AI Tutor', icon: FiMessageCircle },
      { to: '/study-tools', label: 'Study Tools', icon: FiZap },
      { to: '/study-planner', label: 'Study Planner', icon: FiCheckSquare },
      { to: '/calendar', label: 'Calendar', icon: FiCalendar },
      { to: '/academic-journey', label: 'Academic Journey', icon: FiTarget },
      { to: '/leaderboard', label: 'Leaderboard', icon: FiAward },
      { to: '/achievements', label: 'Achievements', icon: FiStar },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/groups', label: 'Study Groups', icon: FiUsers },
      { to: '/live-classes', label: 'Live Classes', icon: FiVideo },
      { to: '/feed', label: 'Feed', icon: FiMessageCircle },
      { to: '/messages', label: 'Messages', icon: FiMail },
      { to: '/accountability', label: 'Accountability Partners', icon: FiTarget },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/tutors', label: 'Find a Tutor', icon: FiShoppingBag },
    ],
  },
  {
    label: 'Career',
    items: [
      { to: '/career/cv', label: 'CV Builder', icon: FiBriefcase },
      { to: '/career/opportunities', label: 'Scholarships', icon: FiAward },
    ],
  },
  {
    label: 'Personal',
    items: [
      { to: '/profile', label: 'Profile', icon: FiUser },
      { to: '/saved', label: 'Saved', icon: FiBookmark },
      { to: '/payments', label: 'Payment History', icon: FiCreditCard },
      { to: '/settings', label: 'Settings', icon: FiSettings },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>V</div>
          <span className={styles.logo}>Vorexa</span>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={styles.group}>
            <div className={styles.groupLabel}>{group.label}</div>
            <nav className={styles.nav}>
              {group.items.map(({ to, label, icon: Icon, soon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles['navItem--active'] : ''}`
                  }
                >
                  <span className={styles.navItemLeft}>
                    <Icon size={17} />
                    {label}
                  </span>
                  {soon && <span className={styles.soonBadge}>SOON</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        <div className={styles.footer}>
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={styles.navItem} style={{ marginBottom: '10px' }}>
              <span className={styles.navItemLeft}>
                <FiShield size={17} />
                Admin Panel
              </span>
            </NavLink>
          )}
          <a
            href={upgradeWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.upgradeCard}
          >
            <div className={styles.upgradeTitle}>Upgrade to Premium</div>
            <div className={styles.upgradeText}>Chat with us on WhatsApp to unlock premium features.</div>
          </a>
        </div>
      </aside>

      <nav className={styles.mobileNav}>
        {ALL_ITEMS.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.mobileNavItem} ${isActive ? styles['mobileNavItem--active'] : ''}`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
