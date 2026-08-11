import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { toggleTwoFactor, getLoginHistory, updateProfile, changePassword } from '../../services/userService';
import { getIncomingRequests, respondToLinkRequest } from '../../services/parentService';
import { getMyInvites, respondToInvite, leaveCentre } from '../../services/centreService';
import { createSupportTicket, getMySupportTickets } from '../../services/supportService';
import { upgradeWhatsAppUrl } from '../../utils/upgrade';
import styles from './Settings.module.scss';

const TABS = ['Account', 'Security', 'Family', 'Centres', 'Support', 'Upgrade', 'Appearance'];

const deviceTimeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const Settings = () => {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(TABS.includes(requestedTab) ? requestedTab : 'Account');
  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.twoFactorEnabled);
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [showTwoFactorConfirm, setShowTwoFactorConfirm] = useState(false);

  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [parentRequests, setParentRequests] = useState([]);
  const [parentRequestsLoading, setParentRequestsLoading] = useState(true);
  const [parentRequestBusyId, setParentRequestBusyId] = useState(null);
  const [parentError, setParentError] = useState('');

  const [centreInvites, setCentreInvites] = useState([]);
  const [centreInvitesLoading, setCentreInvitesLoading] = useState(true);
  const [centreBusyId, setCentreBusyId] = useState(null);
  const [centreError, setCentreError] = useState('');

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'Security') {
      getLoginHistory()
        .then(({ data }) => setLoginHistory(data.history))
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
    if (activeTab === 'Family') {
      setParentRequestsLoading(true);
      setParentError('');
      getIncomingRequests()
        .then(({ data }) => setParentRequests(data.links))
        .catch((err) => setParentError(err.response?.data?.message || 'Could not load parent requests.'))
        .finally(() => setParentRequestsLoading(false));
    }
    if (activeTab === 'Centres') {
      setCentreInvitesLoading(true);
      setCentreError('');
      getMyInvites()
        .then(({ data }) => setCentreInvites(data.invites))
        .catch((err) => setCentreError(err.response?.data?.message || 'Could not load centre invites.'))
        .finally(() => setCentreInvitesLoading(false));
    }
    if (activeTab === 'Support') {
      setTicketsLoading(true);
      getMySupportTickets()
        .then(({ data }) => setTickets(data.tickets))
        .catch(() => {})
        .finally(() => setTicketsLoading(false));
    }
  }, [activeTab]);

  const handleCentreInviteResponse = async (id, action) => {
    setCentreBusyId(id);
    setCentreError('');
    try {
      await respondToInvite(id, action);
      setCentreInvites((prev) => prev.map((i) => (i._id === id ? { ...i, status: action === 'accept' ? 'active' : 'declined' } : i)));
    } catch (err) {
      setCentreError(err.response?.data?.message || 'Could not respond to this invite.');
    } finally {
      setCentreBusyId(null);
    }
  };

  const handleLeaveCentre = async (id) => {
    if (!window.confirm('Leave this centre?')) return;
    setCentreBusyId(id);
    try {
      await leaveCentre(id);
      setCentreInvites((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setCentreError(err.response?.data?.message || 'Could not leave this centre.');
    } finally {
      setCentreBusyId(null);
    }
  };

  const handleParentRequestResponse = async (id, action) => {
    setParentRequestBusyId(id);
    setParentError('');
    try {
      await respondToLinkRequest(id, action);
      setParentRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setParentError(err.response?.data?.message || 'Could not respond to this request.');
    } finally {
      setParentRequestBusyId(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setProfileError('Name cannot be empty');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const { data } = await updateProfile(name.trim());
      setUser((prev) => ({ ...prev, name: data.user.name }));
      setProfileMessage('Saved');
      setTimeout(() => setProfileMessage(''), 2000);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not save your changes.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordError('Enter your current and new password');
      return;
    }
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordMessage('');
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMessage(''), 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Could not update your password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleToggleTwoFactor = async () => {    if (!twoFactorPassword) {
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

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketError('Please fill in a subject and message.');
      return;
    }
    setTicketSending(true);
    setTicketError('');
    setTicketSuccess('');
    try {
      const { data } = await createSupportTicket(ticketSubject.trim(), ticketMessage.trim());
      setTickets((prev) => [data.ticket, ...prev]);
      setTicketSubject('');
      setTicketMessage('');
      setTicketSuccess('Ticket submitted — our team will get back to you here.');
    } catch (err) {
      setTicketError(err.response?.data?.message || 'Could not submit your ticket.');
    } finally {
      setTicketSending(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.layout}>
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <div
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles['tab--active'] : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          {activeTab === 'Account' && (
            <>
              <h2 className={styles.panelTitle}>Account details</h2>
              <Input id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input id="email" label="Email address" value={user?.email || ''} disabled />
              {profileError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{profileError}</p>}
              {profileMessage && <p style={{ color: '#10B981', fontSize: '0.875rem', marginBottom: '1rem' }}>{profileMessage}</p>}
              <div className={styles.saveBtn}>
                <Button
                  style={{ width: 'auto', paddingInline: '2rem' }}
                  onClick={handleSaveProfile}
                  loading={profileSaving}
                >
                  Save changes
                </Button>
              </div>
            </>
          )}

          {activeTab === 'Security' && (
            <>
              <h2 className={styles.panelTitle}>Password</h2>
              <Input
                id="current-password"
                label="Current password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                id="new-password"
                label="New password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {passwordError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{passwordError}</p>}
              {passwordMessage && <p style={{ color: '#10B981', fontSize: '0.875rem', marginBottom: '1rem' }}>{passwordMessage}</p>}
              <div className={styles.saveBtn} style={{ marginBottom: '2rem' }}>
                <Button
                  style={{ width: 'auto', paddingInline: '2rem' }}
                  onClick={handleChangePassword}
                  loading={passwordSaving}
                >
                  Update password
                </Button>
              </div>

              <h2 className={styles.panelTitle}>Two-factor authentication</h2>
              <div className={styles.themeRow} style={{ marginBottom: showTwoFactorConfirm ? '1rem' : '2rem' }}>
                <span className={styles.themeOption}>
                  {twoFactorEnabled ? 'Enabled — a code is emailed to you at each login' : 'Disabled'}
                </span>
                <Button
                  variant="outline"
                  style={{ width: 'auto', paddingInline: '1.5rem' }}
                  onClick={() => setShowTwoFactorConfirm((s) => !s)}
                >
                  {twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              {showTwoFactorConfirm && (
                <div style={{ marginBottom: '2rem' }}>
                  <Input
                    id="2fa-password"
                    label="Confirm your password"
                    type="password"
                    placeholder="Enter your password"
                    value={twoFactorPassword}
                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                  />
                  {twoFactorError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{twoFactorError}</p>}
                  <Button style={{ width: 'auto', paddingInline: '2rem' }} onClick={handleToggleTwoFactor} loading={twoFactorLoading}>
                    Confirm
                  </Button>
                </div>
              )}

              <h2 className={styles.panelTitle}>Login history</h2>
              {historyLoading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>}
              {!historyLoading && loginHistory.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No login history yet.</p>
              )}
              {loginHistory.map((entry) => (
                <div key={entry._id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{entry.device}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.ipAddress || 'Unknown IP'}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{deviceTimeAgo(entry.createdAt)}</div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'Family' && (
            <>
              <h2 className={styles.panelTitle}>Parent link requests</h2>
              {parentError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{parentError}</p>}
              {parentRequestsLoading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>}
              {!parentRequestsLoading && parentRequests.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No pending requests. A parent/guardian can request to link with your account using this email.
                </p>
              )}
              {parentRequests.map((r) => (
                <div
                  key={r._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.parentId?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.parentId?.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                      style={{ width: 'auto', paddingInline: '1rem' }}
                      onClick={() => handleParentRequestResponse(r._id, 'approve')}
                      loading={parentRequestBusyId === r._id}
                    >
                      Approve
                    </Button>
                    <button
                      style={{
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: '#EF4444',
                        borderRadius: '6px',
                        padding: '0 1rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                      onClick={() => handleParentRequestResponse(r._id, 'decline')}
                      disabled={parentRequestBusyId === r._id}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'Centres' && (
            <>
              <h2 className={styles.panelTitle}>Tutorial centre invites</h2>
              {centreError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{centreError}</p>}
              {centreInvitesLoading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>}
              {!centreInvitesLoading && centreInvites.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No centre invites. A tutorial centre can invite you by this email.
                </p>
              )}
              {centreInvites.map((invite) => (
                <div
                  key={invite._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{invite.centreId?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {invite.status}
                    </div>
                  </div>
                  {invite.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        style={{ width: 'auto', paddingInline: '1rem' }}
                        onClick={() => handleCentreInviteResponse(invite._id, 'accept')}
                        loading={centreBusyId === invite._id}
                      >
                        Accept
                      </Button>
                      <button
                        style={{
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: '#EF4444',
                          borderRadius: '6px',
                          padding: '0 1rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                        onClick={() => handleCentreInviteResponse(invite._id, 'decline')}
                        disabled={centreBusyId === invite._id}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {invite.status === 'active' && (
                    <button
                      style={{
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: '#EF4444',
                        borderRadius: '6px',
                        padding: '0.4rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                      onClick={() => handleLeaveCentre(invite._id)}
                      disabled={centreBusyId === invite._id}
                    >
                      Leave
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {activeTab === 'Support' && (
            <>
              <h2 className={styles.panelTitle}>Contact support</h2>
              <form onSubmit={handleSubmitTicket}>
                <Input
                  id="ticket-subject"
                  label="Subject"
                  placeholder="What's this about?"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                />
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="ticket-message" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Message
                  </label>
                  <textarea
                    id="ticket-message"
                    placeholder="Describe the issue or question in detail..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                {ticketError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{ticketError}</p>}
                {ticketSuccess && <p style={{ color: '#10B981', fontSize: '0.875rem', marginBottom: '1rem' }}>{ticketSuccess}</p>}
                <div className={styles.saveBtn} style={{ marginBottom: '2rem' }}>
                  <Button type="submit" style={{ width: 'auto', paddingInline: '2rem' }} loading={ticketSending}>
                    Submit ticket
                  </Button>
                </div>
              </form>

              <h2 className={styles.panelTitle}>Your tickets</h2>
              {ticketsLoading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>}
              {!ticketsLoading && tickets.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No tickets yet.</p>
              )}
              {tickets.map((t) => (
                <div key={t._id} style={{ padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t.subject}</div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '999px',
                        background: t.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.15)',
                        color: t.status === 'resolved' ? '#10B981' : '#2563EB',
                      }}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{t.message}</div>
                  {t.adminReply && (
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Support replied: "{t.adminReply}"
                    </div>
                  )}
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
                <span className={styles.themeOption}>
                  {theme === 'light' ? 'Light mode' : 'Dark mode'}
                </span>
                <Button
                  variant="outline"
                  style={{ width: 'auto', paddingInline: '1.5rem' }}
                  onClick={toggleTheme}
                >
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

export default Settings;
