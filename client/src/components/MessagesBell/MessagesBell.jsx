import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import { getUnreadMessageCount } from '../../services/messageService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { messagesBasePath } from '../../utils/roleRoutes';
import styles from '../NotificationBell/NotificationBell.module.scss';

// Socket pushes handle the live case; this is just a safety net in case a push is missed.
const POLL_INTERVAL_MS = 60000;

const MessagesBell = () => {
  const navigate = useNavigate();
  const { conversationId: activeConversationId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await getUnreadMessageCount();
      setUnreadCount(data.count);
    } catch {
      // silent — background poll
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ conversationId, message }) => {
      // Don't bump the badge for messages I sent myself, or a conversation already open.
      if (message.senderId === user?._id) return;
      if (conversationId === activeConversationId) return;
      setUnreadCount((prev) => prev + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    };

    const handleRead = () => fetchUnreadCount();

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleRead);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleRead);
    };
  }, [socket, activeConversationId, fetchUnreadCount, user?._id]);

  return (
    <button
      className={`${styles.iconBtn} ${pulse ? styles.pulse : ''}`}
      onClick={() => navigate(messagesBasePath(user?.role))}
      aria-label="Messages"
    >
      <FiMail size={18} />
      {unreadCount > 0 && <span className={styles.dot}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
  );
};

export default MessagesBell;
