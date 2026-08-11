import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import { toggleTwoFactor, getLoginHistory } from '../../../services/userService';
import { upgradeWhatsAppUrl } from '../../../utils/upgrade';
import styles from './TutorSettings.module.scss';

const TABS = ['Account', 'Security', 'Upgrade', 'Appearance'];

const TutorSettings = () => {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Account');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.twoFactorEnabled);
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [showTwoFactorConfirm, setShowTwoFactorConfirm] = useState(false);

  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'Security') {
      getLoginHistory().then(({ data }) => setLoginHistory(data.history)).catch(() => {}).finally(() => setHistoryLoading(false));
    }
  }, [activeTab]);

  const handleToggleTwoFactor = async () => {
    if (!twoFactorPassword) {
      setTwoFactorError('Enter your password to confirm this change');
      return;
    }
    setTwoFactorLoading(true);
    setTwoFactorError('');
    try {
      const { data } = await toggleTwoFactor(!twoFactorEnabled, twoFactorPassword);
      setTwoFactorEnabled(data.twoFactorEnabled);
      setUser((prev) => ({ ...prev, twoFactorEnabled: data.twoFactorEnabled }));
      setTwoFactorPassword('');
      setShowTwoFactorConfirm(false);
    } catch (err) {
      setTwoFactorError(err.response?.data?.message || 'Could not update 2FA setting.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.layout}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <div key={tab} className={`${styles.tab} ${activeTab === tab ? styles['tab--active'] : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          {activeTab === 'Account' && (
            <>
              <h2 className={styles.panelTitle}>Account details</h2>
              <Input id="name" label="Full name" value={user?.name || ''} disabled />
              <Input id="email" label="Email address" value={user?.email || ''} disabled />
            </>
          )}

          {activeTab === 'Security' && (
            <>
              <h2 className={styles.panelTitle}>Two-factor authentication</h2>
              <div className={styles.themeRow} style={{ marginBottom: showTwoFactorConfirm ? '1rem' : '2rem' }}>
                <span className={styles.themeOption}>{twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                <Button variant="outline" style={{ width: 'auto', paddingInline: '1.5rem' }} onClick={() => setShowTwoFactorConfirm((s) => !s)}>
                  {twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              {showTwoFactorConfirm && (
                <div style={{ marginBottom: '2rem' }}>
                  <Input id="2fa-password" label="Confirm your password" type="password" value={twoFactorPassword} onChange={(e) => setTwoFactorPassword(e.target.value)} />
                  {twoFactorError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{twoFactorError}</p>}
                  <Button style={{ width: 'auto', paddingInline: '2rem' }} onClick={handleToggleTwoFactor} loading={twoFactorLoading}>Confirm</Button>
                </div>
              )}

              <h2 className={styles.panelTitle}>Login history</h2>
              {historyLoading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>}
              {loginHistory.map((entry) => (
                <div key={entry._id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{entry.device}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.ipAddress}</div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'Upgrade' && (
            <>
              <h2 className={styles.panelTitle}>Upgrade to Premium</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', maxWidth: '480px' }}>
                Vorexa plans are handled directly over WhatsApp for now — message us and we'll sort out your upgrade personally.
              </p>
              <a
                href={upgradeWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#25D366',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                Chat on WhatsApp to Upgrade
              </a>
            </>
          )}

          {activeTab === 'Appearance' && (
            <>
              <h2 className={styles.panelTitle}>Theme</h2>
              <div className={styles.themeRow}>
                <span className={styles.themeOption}>{theme === 'light' ? 'Light mode' : 'Dark mode'}</span>
                <Button variant="outline" style={{ width: 'auto', paddingInline: '1.5rem' }} onClick={toggleTheme}>
                  Switch to {theme === 'light' ? 'dark' : 'light'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorSettings;
