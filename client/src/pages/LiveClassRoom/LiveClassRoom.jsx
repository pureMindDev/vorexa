import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff,
  FiMessageCircle, FiEdit3, FiUsers, FiSend, FiHelpCircle, FiX,
} from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { getLiveClass, startLiveClass, endLiveClass, recordJoin, recordLeave } from '../../services/liveClassService';
import Whiteboard from '../../components/Whiteboard/Whiteboard';
import { liveClassesBasePath } from '../../utils/roleRoutes';
import styles from './LiveClassRoom.module.scss';

const REACTION_EMOJIS = ['👍', '🎉', '❤️', '😂', '🤔'];

const VideoTile = ({ stream, name, muted, isLocal, handRaised, isHost, onKick, userId }) => {
  const videoRef = useRef(null);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream || null;
    if (!stream) return;

    // Browsers sometimes silently block autoplay of a stream that has audio — video plays,
    // but you never hear anything and there's no error, just a rejected promise. Catch that
    // and show a explicit "tap to enable sound" prompt instead of failing silently.
    const playPromise = el.play();
    if (playPromise?.catch) {
      playPromise.catch(() => setNeedsAudioUnlock(true));
    }
  }, [stream]);

  const unlockAudio = () => {
    videoRef.current?.play().then(() => setNeedsAudioUnlock(false)).catch(() => {});
  };

  return (
    <div className={styles.videoTile}>
      <video ref={videoRef} autoPlay playsInline muted={muted} className={styles.video} />
      {!stream && <div className={styles.videoPlaceholder}>{name?.charAt(0)?.toUpperCase()}</div>}
      {needsAudioUnlock && (
        <button type="button" className={styles.unlockAudioBtn} onClick={unlockAudio}>
          🔇 Tap to enable sound
        </button>
      )}
      <div className={styles.videoLabel}>
        {handRaised && '✋ '}
        {isLocal ? 'You' : name}
      </div>
      {isHost && !isLocal && (
        <button type="button" className={styles.kickBtn} onClick={() => onKick(userId)} title={`Remove ${name}`}>
          Remove
        </button>
      )}
    </div>
  );
};

const LiveClassRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [liveClass, setLiveClass] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activePanel, setActivePanel] = useState('chat'); // chat | whiteboard | participants
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const [handRaised, setHandRaised] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [myQuizAnswer, setMyQuizAnswer] = useState(null);
  const [quizDraft, setQuizDraft] = useState({ question: '', options: ['', ''] });
  const [showQuizComposer, setShowQuizComposer] = useState(false);
  const cameraTrackRef = useRef(null);
  const chatEndRef = useRef(null);

  const { remoteStreams } = useWebRTC(socket, id, localStream);

  // --- Load class details + access check ---
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getLiveClass(id);
        setLiveClass(data.liveClass);
        setIsHost(data.isHost);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load this live class.');
      }
    })();
  }, [id]);

  // --- Get camera/mic, with graceful fallback instead of an all-or-nothing block ---
  useEffect(() => {
    let stream;
    (async () => {
      // getUserMedia is only available in a secure context (HTTPS, or localhost). On a plain
      // HTTP deployment the API is simply undefined — that's the single most common reason
      // "it only works on mobile" (a phone visiting the same http:// URL fails identically;
      // this usually means it was actually tested against different URLs, e.g. localhost vs LAN IP).
      if (!window.isSecureContext) {
        setMediaError('Video/audio requires a secure connection (HTTPS). Ask the site owner to enable SSL, or use https:// instead of http://.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError('This browser does not support video calls. Try the latest Chrome, Firefox, or Safari.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraTrackRef.current = stream.getVideoTracks()[0];
        setLocalStream(stream);
        return;
      } catch (err) {
        // Fall through to narrower fallbacks below rather than giving up entirely.
      }

      // Camera+mic together failed — a very common case is a desktop with no webcam but a
      // working microphone (or vice versa). Try audio-only next so the class isn't a hard stop.
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setLocalStream(stream);
        setCameraOn(false);
        setMediaError('No camera detected — joined with audio only.');
        return;
      } catch (err) {
        // no audio device either — fall through to view-only
      }

      // Neither camera nor mic available/permitted — still let them join to watch, hear,
      // chat, and use the whiteboard rather than blocking the whole feature.
      const reason =
        window.location.protocol !== 'https:' && window.location.hostname !== 'localhost'
          ? 'Camera/microphone access was blocked.'
          : "Couldn't access your camera or microphone.";
      setMediaError(`${reason} You can still watch and chat — check your browser's site permissions to enable video.`);
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // --- Join the socket room + record attendance once we have access confirmed ---
  useEffect(() => {
    if (!socket || !connected || !liveClass) return;
    socket.emit('live:join', { liveClassId: id });
    recordJoin(id).catch(() => {});
    return () => {
      socket.emit('live:leave', { liveClassId: id });
      recordLeave(id).catch(() => {});
    };
  }, [socket, connected, liveClass, id]);

  // --- Socket event wiring: chat, reactions, raise hand, quiz ---
  useEffect(() => {
    if (!socket) return;

    const handleChat = (payload) => setChatMessages((prev) => [...prev, payload]);
    const handleReaction = (payload) => {
      const reactionId = `${payload.userId}-${Date.now()}-${Math.random()}`;
      setReactions((prev) => [...prev, { ...payload, id: reactionId }]);
      setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== reactionId)), 2500);
    };
    const handleHand = ({ userId, name, raised }) => {
      setRaisedHands((prev) => {
        const next = { ...prev };
        if (raised) next[userId] = name;
        else delete next[userId];
        return next;
      });
    };
    const handleQuizNew = (payload) => {
      setQuiz(payload);
      setQuizAnswers([]);
      setMyQuizAnswer(null);
    };
    const handleQuizAnswer = (payload) =>
      setQuizAnswers((prev) => [...prev.filter((a) => a.userId !== payload.userId), payload]);
    const handleQuizEnded = () => setQuiz(null);

    socket.on('live:chat', handleChat);
    socket.on('live:reaction', handleReaction);
    socket.on('live:hand', handleHand);
    socket.on('quiz:new', handleQuizNew);
    socket.on('quiz:answer', handleQuizAnswer);
    socket.on('quiz:ended', handleQuizEnded);

    return () => {
      socket.off('live:chat', handleChat);
      socket.off('live:reaction', handleReaction);
      socket.off('live:hand', handleHand);
      socket.off('quiz:new', handleQuizNew);
      socket.off('quiz:answer', handleQuizAnswer);
      socket.off('quiz:ended', handleQuizEnded);
    };
  }, [socket]);

  // If the host ends the class while we're still in it (or it goes live while we're on the
  // pre-start screen), react immediately instead of talking to a room that's already gone.
  useEffect(() => {
    if (!socket || !id) return;
    const handleStatusChange = ({ liveClassId, status }) => {
      if (liveClassId !== id) return;
      if (status === 'ended') {
        localStream?.getTracks().forEach((t) => t.stop());
        alert('The host has ended this class.');
        navigate(liveClassesBasePath(user?.role));
      } else if (status === 'live') {
        setLiveClass((prev) => (prev ? { ...prev, status: 'live' } : prev));
      }
    };
    socket.on('live:class-status-changed', handleStatusChange);
    return () => socket.off('live:class-status-changed', handleStatusChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, id]);

  // Room-join failures used to fail silently — now they surface a clear message instead of
  // the student just sitting there with no video/audio/chat and no idea why.
  useEffect(() => {
    if (!socket || !id) return;

    const goToList = () =>
      navigate(liveClassesBasePath(user?.role));

    const handleJoinDenied = ({ liveClassId }) => {
      if (liveClassId !== id) return;
      localStream?.getTracks().forEach((t) => t.stop());
      alert("Couldn't join this live class — you may not have access, or the class may no longer exist.");
      goToList();
    };

    const handleKicked = ({ liveClassId }) => {
      if (liveClassId !== id) return;
      localStream?.getTracks().forEach((t) => t.stop());
      alert('The host removed you from this class.');
      goToList();
    };

    socket.on('live:join-denied', handleJoinDenied);
    socket.on('live:kicked', handleKicked);
    return () => {
      socket.off('live:join-denied', handleJoinDenied);
      socket.off('live:kicked', handleKicked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, id]);

  const handleKickParticipant = (targetUserId) => {
    if (!window.confirm('Remove this participant from the class?')) return;
    socket?.emit('live:kick', { liveClassId: id, targetUserId });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((v) => !v);
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !cameraOn));
    setCameraOn((v) => !v);
  };

  const restoreCameraTrack = useCallback(() => {
    const camTrack = cameraTrackRef.current;
    if (camTrack && localStream) {
      localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t));
      localStream.addTrack(camTrack);
      setLocalStream(new MediaStream(localStream.getTracks()));
    }
    setScreenSharing(false);
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      restoreCameraTrack();
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      // Most mobile browsers (Chrome/Safari on Android and iOS) don't implement screen
      // capture at all — the old code just silently swallowed this as if the user had
      // cancelled a share dialog that was never actually shown.
      setMediaError('Screen sharing is not supported on this browser/device — try from a desktop browser instead.');
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrack.onended = () => restoreCameraTrack();

      if (localStream) {
        localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t));
        localStream.addTrack(screenTrack);
        setLocalStream(new MediaStream(localStream.getTracks()));
      }
      setScreenSharing(true);
    } catch (err) {
      // NotAllowedError means the user actually cancelled the picker — that's a normal,
      // silent no-op. Anything else is a real failure worth surfacing.
      if (err?.name !== 'NotAllowedError') {
        setMediaError("Couldn't start screen sharing — please try again.");
      }
    }
  }, [screenSharing, localStream, restoreCameraTrack]);

  const handleLeave = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    const base = liveClassesBasePath(user?.role);
    navigate(base);
  };

  const handleStart = async () => {
    try {
      const { data } = await startLiveClass(id);
      setLiveClass(data.liveClass);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the class.');
    }
  };

  const handleEnd = async () => {
    if (!window.confirm('End this live class for everyone?')) return;
    try {
      await endLiveClass(id);
      handleLeave();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not end the class.');
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket?.emit('live:chat', { liveClassId: id, message: chatInput.trim() });
    setChatInput('');
  };

  const sendReaction = (emoji) => socket?.emit('live:reaction', { liveClassId: id, emoji });

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    socket?.emit('live:hand', { liveClassId: id, raised: next });
  };

  const pushQuiz = (e) => {
    e.preventDefault();
    const options = quizDraft.options.map((o) => o.trim()).filter(Boolean);
    if (!quizDraft.question.trim() || options.length < 2) return;
    socket?.emit('quiz:push', { liveClassId: id, question: quizDraft.question.trim(), options });
    setQuiz({ question: quizDraft.question.trim(), options });
    setQuizAnswers([]);
    setShowQuizComposer(false);
    setQuizDraft({ question: '', options: ['', ''] });
  };

  const answerQuiz = (index) => {
    setMyQuizAnswer(index);
    socket?.emit('quiz:answer', { liveClassId: id, optionIndex: index });
  };

  const endQuiz = () => {
    socket?.emit('quiz:end', { liveClassId: id });
    setQuiz(null);
  };

  if (error && !liveClass) {
    return <p className={styles.errorFull}>{error}</p>;
  }
  if (!liveClass) {
    return <p className={styles.loadingFull}>Loading...</p>;
  }

  const peerEntries = Object.entries(remoteStreams);

  return (
    <div className={styles.room}>
      <div className={styles.mainArea}>
        <div className={styles.roomHeader}>
          <div>
            <h1 className={styles.roomTitle}>{liveClass.title}</h1>
            <span className={styles.roomStatus}>{liveClass.status === 'live' ? '🔴 Live' : liveClass.status}</span>
          </div>
          {isHost && liveClass.status === 'scheduled' && (
            <button className={styles.startBtn} onClick={handleStart}>Start class</button>
          )}
          {isHost && liveClass.status === 'live' && (
            <button className={styles.endBtn} onClick={handleEnd}>End class</button>
          )}
        </div>

        {error && <p className={styles.errorInline}>{error}</p>}
        {mediaError && <p className={styles.errorInline}>{mediaError}</p>}

        <div className={styles.videoGrid}>
          <VideoTile stream={localStream} name={user?.name} muted isLocal handRaised={handRaised} />
          {peerEntries.map(([peerId, { stream, name }]) => (
            <VideoTile
              key={peerId}
              stream={stream}
              name={name}
              handRaised={!!raisedHands[peerId]}
              isHost={isHost}
              userId={peerId}
              onKick={handleKickParticipant}
            />
          ))}
        </div>

        <div className={styles.reactionLayer}>
          {reactions.map((r) => (
            <span key={r.id} className={styles.floatingReaction}>{r.emoji}</span>
          ))}
        </div>

        {quiz && (
          <div className={styles.quizBanner}>
            <div className={styles.quizQuestion}>{quiz.question}</div>
            {isHost ? (
              <>
                <div className={styles.quizTally}>
                  {quiz.options.map((opt, i) => {
                    const count = quizAnswers.filter((a) => a.optionIndex === i).length;
                    return (
                      <div key={i} className={styles.quizTallyRow}>
                        <span>{opt}</span>
                        <span className={styles.quizTallyBar} style={{ width: `${count * 20 + 10}px` }} />
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <button className={styles.endQuizBtn} onClick={endQuiz}>End quiz</button>
              </>
            ) : (
              <div className={styles.quizOptions}>
                {quiz.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`${styles.quizOptionBtn} ${myQuizAnswer === i ? styles['quizOptionBtn--selected'] : ''}`}
                    onClick={() => answerQuiz(i)}
                    disabled={myQuizAnswer !== null}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.controlBar}>
          <button className={`${styles.controlBtn} ${!micOn ? styles['controlBtn--off'] : ''}`} onClick={toggleMic}>
            {micOn ? <FiMic size={18} /> : <FiMicOff size={18} />}
            <span className={styles.controlLabel}>{micOn ? 'Mute' : 'Unmute'}</span>
          </button>
          <button className={`${styles.controlBtn} ${!cameraOn ? styles['controlBtn--off'] : ''}`} onClick={toggleCamera}>
            {cameraOn ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
            <span className={styles.controlLabel}>{cameraOn ? 'Stop video' : 'Start video'}</span>
          </button>
          <button className={`${styles.controlBtn} ${screenSharing ? styles['controlBtn--active'] : ''}`} onClick={toggleScreenShare}>
            <FiMonitor size={18} />
            <span className={styles.controlLabel}>{screenSharing ? 'Stop sharing' : 'Share screen'}</span>
          </button>
          <button className={`${styles.controlBtn} ${handRaised ? styles['controlBtn--active'] : ''}`} onClick={toggleHand}>
            <FiHelpCircle size={18} />
            <span className={styles.controlLabel}>{handRaised ? 'Lower hand' : 'Raise hand'}</span>
          </button>
          {isHost && (
            <button className={styles.controlBtn} onClick={() => setShowQuizComposer(true)} title="Push a quick quiz">
              <span className={styles.controlLabel}>Quiz</span>
            </button>
          )}
          <div className={styles.reactionPicker}>
            {REACTION_EMOJIS.map((e) => (
              <button key={e} className={styles.reactionBtn} onClick={() => sendReaction(e)}>{e}</button>
            ))}
          </div>
          <button className={`${styles.controlBtn} ${styles['controlBtn--leave']}`} onClick={handleLeave}>
            <FiPhoneOff size={18} />
            <span className={styles.controlLabel}>Leave</span>
          </button>
        </div>
      </div>

      <div className={styles.sidePanel}>
        <div className={styles.panelTabs}>
          <button className={`${styles.panelTab} ${activePanel === 'chat' ? styles['panelTab--active'] : ''}`} onClick={() => setActivePanel('chat')}>
            <FiMessageCircle size={15} />
          </button>
          <button className={`${styles.panelTab} ${activePanel === 'whiteboard' ? styles['panelTab--active'] : ''}`} onClick={() => setActivePanel('whiteboard')}>
            <FiEdit3 size={15} />
          </button>
          <button className={`${styles.panelTab} ${activePanel === 'participants' ? styles['panelTab--active'] : ''}`} onClick={() => setActivePanel('participants')}>
            <FiUsers size={15} />
          </button>
        </div>

        {activePanel === 'chat' && (
          <div className={styles.chatPanel}>
            <div className={styles.chatMessages}>
              {chatMessages.map((m, i) => (
                <div key={i} className={styles.chatMessage}>
                  <span className={styles.chatAuthor}>{m.userId === user?._id ? 'You' : m.name}:</span> {m.message}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className={styles.chatInputBar} onSubmit={sendChat}>
              <input className={styles.chatInput} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." />
              <button className={styles.chatSendBtn} type="submit" disabled={!chatInput.trim()}><FiSend size={15} /></button>
            </form>
          </div>
        )}

        {activePanel === 'whiteboard' && <Whiteboard socket={socket} liveClassId={id} />}

        {activePanel === 'participants' && (
          <div className={styles.participantsPanel}>
            <div className={styles.participantRow}>{user?.name} (You){handRaised && ' ✋'}</div>
            {peerEntries.map(([peerId, { name }]) => (
              <div key={peerId} className={styles.participantRow}>{name}{raisedHands[peerId] && ' ✋'}</div>
            ))}
          </div>
        )}
      </div>

      {showQuizComposer && (
        <div className={styles.modalOverlay} onClick={() => setShowQuizComposer(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Push a quick quiz</span>
              <FiX size={18} style={{ cursor: 'pointer' }} onClick={() => setShowQuizComposer(false)} />
            </div>
            <form onSubmit={pushQuiz}>
              <input
                className={styles.modalInput}
                placeholder="Question"
                value={quizDraft.question}
                onChange={(e) => setQuizDraft((d) => ({ ...d, question: e.target.value }))}
              />
              {quizDraft.options.map((opt, i) => (
                <input
                  key={i}
                  className={styles.modalInput}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) =>
                    setQuizDraft((d) => ({ ...d, options: d.options.map((o, oi) => (oi === i ? e.target.value : o)) }))
                  }
                />
              ))}
              {quizDraft.options.length < 4 && (
                <button
                  type="button"
                  className={styles.addOptionBtn}
                  onClick={() => setQuizDraft((d) => ({ ...d, options: [...d.options, ''] }))}
                >
                  + Add option
                </button>
              )}
              <button type="submit" className={styles.pushQuizBtn}>Push to class</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassRoom;
