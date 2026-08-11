import { useState, useEffect, useRef, useCallback } from 'react';
import { FiPlay, FiPause, FiRotateCcw, FiSend } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { logPomodoroSession } from '../../services/pomodoroService';
import styles from './StudyRoom.module.scss';

const DURATIONS = { focus: 25, short_break: 5, long_break: 15 };

const formatTime = (totalSeconds) => {
  const m = Math.floor(Math.max(totalSeconds, 0) / 60);
  const s = Math.max(totalSeconds, 0) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StudyRoom = ({ groupId }) => {
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const [participants, setParticipants] = useState([]);
  const [timerStatus, setTimerStatus] = useState('idle'); // idle | running | paused
  const [timerType, setTimerType] = useState('focus');
  const [durationMinutes, setDurationMinutes] = useState(DURATIONS.focus);
  const [startedAt, setStartedAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(DURATIONS.focus * 60);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const tickRef = useRef(null);
  const loggedThisRunRef = useRef(false);

  // Join the room as soon as the socket is ready, leave on unmount / group change.
  useEffect(() => {
    if (!socket || !connected || !groupId) return;
    socket.emit('room:join', { groupId });
    return () => socket.emit('room:leave', { groupId });
  }, [socket, connected, groupId]);

  useEffect(() => {
    if (!socket) return;

    const handleParticipants = (payload) => {
      if (payload.groupId === groupId) setParticipants(payload.participants);
    };

    const handleTimerUpdate = (payload) => {
      if (payload.groupId !== groupId) return;
      setTimerStatus(payload.status);
      if (payload.status === 'running') {
        setTimerType(payload.type);
        setDurationMinutes(payload.durationMinutes);
        setStartedAt(new Date(payload.startedAt));
        loggedThisRunRef.current = false;
      } else if (payload.status === 'idle') {
        setStartedAt(null);
        setRemainingSeconds(durationMinutes * 60);
      }
    };

    const handleChat = (payload) => {
      if (payload.groupId === groupId) setChatMessages((prev) => [...prev, payload]);
    };

    socket.on('room:participants', handleParticipants);
    socket.on('room:timer:update', handleTimerUpdate);
    socket.on('room:chat', handleChat);
    return () => {
      socket.off('room:participants', handleParticipants);
      socket.off('room:timer:update', handleTimerUpdate);
      socket.off('room:chat', handleChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, groupId]);

  // Local countdown tick — every client computes remaining time from the shared startedAt, so
  // everyone stays in sync without the server needing to run a timer loop itself.
  useEffect(() => {
    clearInterval(tickRef.current);
    if (timerStatus !== 'running' || !startedAt) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      const remaining = durationMinutes * 60 - elapsed;
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !loggedThisRunRef.current) {
        loggedThisRunRef.current = true;
        socket?.emit('room:timer:complete', { groupId, type: timerType, durationMinutes });
        logPomodoroSession(timerType, durationMinutes).catch(() => {});
      }
    };

    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => clearInterval(tickRef.current);
  }, [timerStatus, startedAt, durationMinutes, timerType, socket, groupId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const startTimer = (type) => {
    socket?.emit('room:timer:start', { groupId, type, durationMinutes: DURATIONS[type] });
  };

  const pauseTimer = () => socket?.emit('room:timer:pause', { groupId });
  const resetTimer = () => socket?.emit('room:timer:reset', { groupId });

  const sendChat = useCallback(
    (e) => {
      e.preventDefault();
      if (!chatInput.trim()) return;
      socket?.emit('room:chat', { groupId, message: chatInput.trim() });
      setChatInput('');
    },
    [chatInput, socket, groupId]
  );

  return (
    <div className={styles.layout}>
      <div className={styles.timerCard}>
        <div className={styles.timerTypeLabel}>
          {timerType === 'focus' ? 'Focus' : timerType === 'short_break' ? 'Short break' : 'Long break'}
        </div>
        <div className={styles.timerDisplay}>{formatTime(remainingSeconds)}</div>

        <div className={styles.timerControls}>
          {timerStatus === 'running' ? (
            <button className={styles.timerBtn} onClick={pauseTimer}>
              <FiPause size={16} /> Pause
            </button>
          ) : (
            <button className={styles.timerBtn} onClick={() => startTimer(timerStatus === 'paused' ? timerType : 'focus')}>
              <FiPlay size={16} /> {timerStatus === 'paused' ? 'Resume' : 'Start focus'}
            </button>
          )}
          <button className={`${styles.timerBtn} ${styles['timerBtn--ghost']}`} onClick={resetTimer}>
            <FiRotateCcw size={16} /> Reset
          </button>
        </div>

        <div className={styles.presetRow}>
          <button className={styles.presetBtn} onClick={() => startTimer('focus')}>25m Focus</button>
          <button className={styles.presetBtn} onClick={() => startTimer('short_break')}>5m Break</button>
          <button className={styles.presetBtn} onClick={() => startTimer('long_break')}>15m Break</button>
        </div>

        <div className={styles.participantsSection}>
          <div className={styles.participantsLabel}>In this room ({participants.length})</div>
          <div className={styles.participantsList}>
            {participants.map((p) => (
              <div key={p.userId} className={styles.participantChip}>
                <span className={styles.presenceDotSmall} />
                {p.name}
                {p.userId === user?._id && ' (you)'}
              </div>
            ))}
            {participants.length === 0 && <span className={styles.emptyHint}>Joining room...</span>}
          </div>
        </div>
      </div>

      <div className={styles.chatCard}>
        <div className={styles.participantsLabel}>Room chat</div>
        <div className={styles.chatMessages}>
          {chatMessages.length === 0 && <p className={styles.emptyHint}>Say hi to get everyone focused together.</p>}
          {chatMessages.map((m, i) => (
            <div key={i} className={styles.chatMessage}>
              <span className={styles.chatAuthor}>{m.userId === user?._id ? 'You' : m.name}:</span> {m.message}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form className={styles.chatInputBar} onSubmit={sendChat}>
          <input
            className={styles.chatInput}
            placeholder="Message the room..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button className={styles.chatSendBtn} type="submit" disabled={!chatInput.trim()}>
            <FiSend size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudyRoom;
