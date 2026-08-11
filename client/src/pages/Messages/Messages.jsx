import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSend, FiSmile } from 'react-icons/fi';
import { BsCheck, BsCheck2All } from 'react-icons/bs';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getConversations, getMessages, sendMessage, toggleMessageReaction } from '../../services/messageService';
import { messagesBasePath } from '../../utils/roleRoutes';
import styles from './Messages.module.scss';

// Fallback poll in case a socket push was ever missed (dropped connection, etc.) — the socket
// events below do the real-time heavy lifting, this is just a safety net.
const POLL_INTERVAL_MS = 60000;
const TYPING_STOP_DELAY_MS = 2000;
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesBase = messagesBasePath(user?.role);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [otherLastReadAt, setOtherLastReadAt] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [openReactionsFor, setOpenReactionsFor] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await getConversations();
      setConversations(data.conversations);
    } catch {
      // silent — background refresh
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data } = await getMessages(conversationId);
      setMessages(data.messages);
      setOtherLastReadAt(data.otherLastReadAt ? new Date(data.otherLastReadAt) : null);
      if (data.otherUserOnline) {
        setOnlineUserIds((prev) => new Set(prev).add(data.otherUserId));
      }
    } catch {
      // silent — background refresh
    }
  }, [conversationId]);

  // Initial + fallback-poll loads
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    loadMessages();
    setIsOtherTyping(false);
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Mark the conversation read the moment it's opened, and again if a live message arrives while open.
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('conversation:read', { conversationId });
  }, [socket, conversationId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // --- Socket: presence ---
  useEffect(() => {
    if (!socket) return;

    const handleSnapshot = ({ onlineUserIds: ids }) => setOnlineUserIds(new Set(ids));
    const handleOnline = ({ userId }) => setOnlineUserIds((prev) => new Set(prev).add(userId));
    const handleOffline = ({ userId }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

    socket.on('presence:snapshot', handleSnapshot);
    socket.on('presence:online', handleOnline);
    socket.on('presence:offline', handleOffline);
    return () => {
      socket.off('presence:snapshot', handleSnapshot);
      socket.off('presence:online', handleOnline);
      socket.off('presence:offline', handleOffline);
    };
  }, [socket]);

  // --- Socket: incoming messages ---
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ conversationId: incomingId, message }) => {
      if (incomingId === conversationId) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
      // Always refresh the conversation list so previews/ordering stay current.
      loadConversations();
    };

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, conversationId, loadConversations]);

  // --- Socket: read receipts ---
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleRead = ({ conversationId: incomingId, readAt }) => {
      if (incomingId === conversationId) setOtherLastReadAt(new Date(readAt));
    };

    socket.on('message:read', handleRead);
    return () => socket.off('message:read', handleRead);
  }, [socket, conversationId]);

  // --- Socket: typing indicator ---
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleTyping = ({ conversationId: incomingId, isTyping }) => {
      if (incomingId === conversationId) setIsOtherTyping(isTyping);
    };

    socket.on('typing:update', handleTyping);
    return () => socket.off('typing:update', handleTyping);
  }, [socket, conversationId]);

  // --- Socket: reactions ---
  useEffect(() => {
    if (!socket) return;

    const handleReaction = ({ conversationId: incomingId, messageId, reactions }) => {
      if (incomingId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    };

    socket.on('message:reaction', handleReaction);
    return () => socket.off('message:reaction', handleReaction);
  }, [socket, conversationId]);

  const stopTyping = useCallback(() => {
    if (!socket || !conversationId || !isTypingRef.current) return;
    isTypingRef.current = false;
    socket.emit('typing:stop', { conversationId });
  }, [socket, conversationId]);

  // Reset typing/reaction UI whenever the open conversation changes.
  useEffect(() => {
    return () => {
      stopTyping();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, stopTyping]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket || !conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { conversationId });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY_MS);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    clearTimeout(typingTimeoutRef.current);
    stopTyping();
    try {
      const { data } = await sendMessage(conversationId, content);
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      loadConversations();
    } catch {
      setInput(content); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId, emoji) => {
    setOpenReactionsFor(null);
    // Optimistic toggle so the UI feels instant; the socket/REST response reconciles it.
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const already = m.reactions?.some((r) => r.userId === user?._id && r.emoji === emoji);
        const withoutMine = (m.reactions || []).filter((r) => r.userId !== user?._id);
        return { ...m, reactions: already ? withoutMine : [...withoutMine, { userId: user?._id, emoji }] };
      })
    );
    try {
      await toggleMessageReaction(messageId, emoji);
    } catch {
      loadMessages(); // reconcile on failure
    }
  };

  const activeConvo = conversations.find((c) => c.id === conversationId);
  const isActiveOnline = activeConvo && onlineUserIds.has(activeConvo.otherUserId);

  const groupedByMessage = useMemo(() => {
    const map = {};
    messages.forEach((m) => {
      const counts = {};
      (m.reactions || []).forEach((r) => {
        counts[r.emoji] = counts[r.emoji] || { count: 0, mine: false };
        counts[r.emoji].count += 1;
        if (r.userId === user?._id) counts[r.emoji].mine = true;
      });
      map[m.id] = counts;
    });
    return map;
  }, [messages, user?._id]);

  return (
    <div className={styles.layout}>
      <div className={styles.convoList}>
        {conversations.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem' }}>
            No conversations yet. Message someone from their profile.
          </p>
        )}
        {conversations.map((c) => {
          const online = onlineUserIds.has(c.otherUserId) || c.otherUserOnline;
          return (
            <div
              key={c.id}
              className={`${styles.convoItem} ${c.id === conversationId ? styles['convoItem--active'] : ''}`}
              onClick={() => navigate(`${messagesBase}/${c.id}`)}
            >
              <div className={styles.convoAvatarWrap}>
                <div className={styles.convoAvatar}>{c.otherUserName?.charAt(0)?.toUpperCase()}</div>
                {online && <span className={styles.presenceDot} />}
              </div>
              <div className={styles.convoInfo}>
                <div className={`${styles.convoName} ${c.isUnread ? styles['convoName--unread'] : ''}`}>
                  {c.otherUserName}
                </div>
                <div className={styles.convoPreview}>{c.lastMessagePreview || 'No messages yet'}</div>
              </div>
              {c.isUnread && <div className={styles.unreadDot} />}
            </div>
          );
        })}
      </div>

      <div className={styles.chatPanel}>
        {!conversationId ? (
          <div className={styles.emptyState}>Select a conversation to start chatting.</div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <span>{activeConvo?.otherUserName || 'Chat'}</span>
              <span className={styles.chatSubStatus}>
                {isOtherTyping ? 'typing…' : isActiveOnline ? 'Online' : ''}
              </span>
            </div>
            <div className={styles.chatMessages}>
              {messages.map((m) => {
                const isMine = m.senderId === user?._id;
                const wasRead = isMine && otherLastReadAt && new Date(m.createdAt) <= otherLastReadAt;
                const reactionCounts = groupedByMessage[m.id] || {};
                const hasReactions = Object.keys(reactionCounts).length > 0;

                return (
                  <div
                    key={m.id}
                    className={`${styles.bubbleRow} ${isMine ? styles['bubbleRow--mine'] : ''}`}
                    onMouseLeave={() => openReactionsFor === m.id && setOpenReactionsFor(null)}
                  >
                    <div className={styles.bubbleGroup}>
                      <div className={`${styles.bubble} ${isMine ? styles['bubble--mine'] : styles['bubble--theirs']}`}>
                        {m.content}
                        <button
                          type="button"
                          className={styles.reactTrigger}
                          onClick={() => setOpenReactionsFor(openReactionsFor === m.id ? null : m.id)}
                          aria-label="React to message"
                        >
                          <FiSmile size={13} />
                        </button>
                        {openReactionsFor === m.id && (
                          <div className={`${styles.reactionPicker} ${isMine ? styles['reactionPicker--mine'] : ''}`}>
                            {QUICK_REACTIONS.map((emoji) => (
                              <button key={emoji} type="button" onClick={() => handleReact(m.id, emoji)}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {hasReactions && (
                        <div className={`${styles.reactionChips} ${isMine ? styles['reactionChips--mine'] : ''}`}>
                          {Object.entries(reactionCounts).map(([emoji, { count, mine }]) => (
                            <button
                              key={emoji}
                              type="button"
                              className={`${styles.reactionChip} ${mine ? styles['reactionChip--mine'] : ''}`}
                              onClick={() => handleReact(m.id, emoji)}
                            >
                              {emoji} {count > 1 ? count : ''}
                            </button>
                          ))}
                        </div>
                      )}

                      {isMine && (
                        <span className={styles.readReceipt}>
                          {wasRead ? <BsCheck2All size={14} /> : <BsCheck size={14} />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {isOtherTyping && (
                <div className={`${styles.bubble} ${styles['bubble--theirs']} ${styles.typingBubble}`}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className={styles.chatInputBar} onSubmit={handleSend}>
              <input
                className={styles.chatInput}
                placeholder="Type a message..."
                value={input}
                onChange={handleInputChange}
                onBlur={stopTyping}
              />
              <button className={styles.chatSendBtn} type="submit" disabled={sending || !input.trim()}>
                <FiSend size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
