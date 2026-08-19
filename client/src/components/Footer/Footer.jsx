import { Link } from 'react-router-dom';
import { upgradeWhatsAppUrl } from '../../utils/upgrade';
import styles from './Footer.module.scss';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <span className={styles.logo}>Vorexa</span>
            <p className={styles.brandNote}>
              Your all-in-one companion for JAMB, WAEC, and every step of your academic journey.
            </p>
          </div>

          <div>
            <div className={styles.colTitle}>Study</div>
            <ul className={styles.linkList}>
              <li><Link to="/register">CBT practice</Link></li>
              <li><Link to="/register">AI Tutor</Link></li>
              <li><Link to="/register">Live classes</Link></li>
              <li><Link to="/register">Study groups</Link></li>
            </ul>
          </div>

          <div>
            <div className={styles.colTitle}>Community</div>
            <ul className={styles.linkList}>
              <li><Link to="/tutors">Find a tutor</Link></li>
              <li><Link to="/become-tutor">Become a tutor</Link></li>
              <li><Link to="/register">Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <div className={styles.colTitle}>Support</div>
            <ul className={styles.linkList}>
              <li>
                <a href={upgradeWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                  Talk to us on WhatsApp
                </a>
              </li>
              <li><Link to="/login">Log in</Link></li>
              <li><Link to="/register">Create an account</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>&copy; {year} Vorexa. Built for Nigerian students.</span>
          <div className={styles.bottomLinks}>
            <Link to="/register">Get started</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
