import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';
import styles from './NotificationBell.module.scss';

// Socket pushes handle the live case; this is just a safety net in case a push is missed.
const POLL_INTERVAL_MS = 60000;

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [pulse, setPulse] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.count);
    } catch {
      // silent — don't disrupt the UI over a background poll failing
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [notification, ...prev]);
      setLoaded(true);
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePanel = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      try {
        const { data } = await getNotifications();
        setNotifications(data.notifications);
        setLoaded(true);
      } catch {
        // silent
      }
    }
  };

  const handleItemClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
        setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silent
      }
    }
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button className={`${styles.iconBtn} ${pulse ? styles.pulse : ''}`} onClick={togglePanel} aria-label="Notifications">
        <FiBell size={18} />
        {unreadCount > 0 && <span className={styles.dot}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllRead}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`${styles.item} ${!n.isRead ? styles['item--unread'] : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <div className={styles.itemTitle}>{n.title}</div>
                <div className={styles.itemMessage}>{n.message}</div>
                <div className={styles.itemTime}>{timeAgo(n.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
