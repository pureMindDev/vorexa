import ThemeToggle from '../ThemeToggle/ThemeToggle';
import styles from './AuthLayout.module.scss';

const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className={styles.layout}>
      <div className={styles.brandSide}>
        <span className={styles.logo}>Vorexa</span>
        <p className={styles.tagline}>
          Your all-in-one companion for JAMB, WAEC, and every step of your academic journey.
        </p>
      </div>

      <div className={styles.formSide}>
        <div className={styles.topBar}>
          <ThemeToggle />
        </div>

        <div className={styles.formWrap}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
