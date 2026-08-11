import { useEffect, useRef } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiPhone, FiX } from 'react-icons/fi';
import styles from './CallOverlay.module.scss';

const StreamTile = ({ stream, muted, label, fallbackLetter, dimmed, className }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream || null;
    el.play?.().catch(() => {});
  }, [stream]);

  const hasVideo = stream?.getVideoTracks?.().some((t) => t.enabled);

  return (
    <div className={`${styles.tile} ${className || ''}`}>
      <video ref={videoRef} autoPlay playsInline muted={muted} className={styles.video} />
      {(!hasVideo || dimmed) && <div className={styles.avatar}>{fallbackLetter}</div>}
      <span className={styles.tileLabel}>{label}</span>
    </div>
  );
};

const CallOverlay = ({
  call,
  status,
  localStream,
  remoteStream,
  error,
  micOn,
  cameraOn,
  peerMedia,
  acceptCall,
  rejectCall,
  endCall,
  toggleMic,
  toggleCamera,
  dismissError,
}) => {
  // A transient error with no live call (declined, offline, no answer) shows as a toast.
  if (!call) {
    if (!error) return null;
    return (
      <div className={styles.toast} role="status">
        {error}
        <button type="button" className={styles.toastClose} onClick={dismissError} aria-label="Dismiss">
          <FiX size={14} />
        </button>
      </div>
    );
  }

  const peerLetter = call.peerName?.charAt(0)?.toUpperCase() || '?';
  const isRinging = status === 'ringing';
  const isCalling = status === 'calling';

  if (isRinging || isCalling) {
    return (
      <div className={styles.ringOverlay} role="dialog" aria-label="Call">
        <div className={styles.ringCard}>
          <div className={styles.ringAvatar}>{peerLetter}</div>
          <h3 className={styles.ringName}>{call.peerName}</h3>
          <p className={styles.ringStatus}>
            {isRinging
              ? `Incoming ${call.callType} call…`
              : `Calling…`}
          </p>
          <div className={styles.ringActions}>
            {isRinging && (
              <button type="button" className={`${styles.roundBtn} ${styles['roundBtn--accept']}`} onClick={acceptCall}>
                <FiPhone size={20} />
              </button>
            )}
            <button type="button" className={`${styles.roundBtn} ${styles['roundBtn--end']}`} onClick={rejectCall}>
              <FiPhoneOff size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.callOverlay} role="dialog" aria-label="Ongoing call">
      <div className={styles.stage}>
        <StreamTile
          stream={remoteStream}
          muted={false}
          label={`${call.peerName}${peerMedia?.micOn === false ? ' · muted' : ''}`}
          fallbackLetter={peerLetter}
          dimmed={peerMedia?.cameraOn === false}
          className={styles['tile--remote']}
        />
        <StreamTile
          stream={localStream}
          muted
          label="You"
          fallbackLetter="Y"
          dimmed={!cameraOn}
          className={styles['tile--local']}
        />
        {status === 'connecting' && <div className={styles.connecting}>Connecting…</div>}
      </div>

      {error && <div className={styles.inlineError}>{error}</div>}

      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.roundBtn} ${!micOn ? styles['roundBtn--off'] : ''}`}
          onClick={toggleMic}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <FiMic size={18} /> : <FiMicOff size={18} />}
        </button>
        {call.callType === 'video' && (
          <button
            type="button"
            className={`${styles.roundBtn} ${!cameraOn ? styles['roundBtn--off'] : ''}`}
            onClick={toggleCamera}
            aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {cameraOn ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
          </button>
        )}
        <button
          type="button"
          className={`${styles.roundBtn} ${styles['roundBtn--end']}`}
          onClick={endCall}
          aria-label="End call"
        >
          <FiPhoneOff size={18} />
        </button>
      </div>
    </div>
  );
};

export default CallOverlay;
