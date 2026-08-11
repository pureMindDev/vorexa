import { useState, useEffect, useRef, useCallback } from 'react';

// Shared ICE configuration for every peer connection in the app (1:1 calls and the
// live-class mesh). STUN alone is enough for most home/office networks; a TURN relay is
// needed for strict/symmetric NATs, so it is read from env and simply omitted when unset.
const STUN_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

export const getIceServers = () => {
  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (!turnUrl) return STUN_SERVERS;
  return [
    ...STUN_SERVERS,
    {
      urls: turnUrl.split(',').map((u) => u.trim()).filter(Boolean),
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
  ];
};

const stopStream = (stream) => stream?.getTracks().forEach((t) => t.stop());

/**
 * One-to-one WebRTC calling over the DM socket channel.
 *
 * State machine: idle -> (outgoing: 'calling' | incoming: 'ringing') -> 'connecting' -> 'active' -> idle.
 * The caller creates the offer only after the callee accepts, so no camera is opened on a
 * call that is never picked up.
 */
export const useDirectCall = (socket) => {
  const [call, setCall] = useState(null); // { callId, peerId, peerName, callType, direction }
  const [status, setStatus] = useState('idle'); // idle | calling | ringing | connecting | active | ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [peerMedia, setPeerMedia] = useState({ micOn: true, cameraOn: true });

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setMicOn(true);
    setCameraOn(true);
    setPeerMedia({ micOn: true, cameraOn: true });
    callRef.current = null;
  }, []);

  const getMedia = useCallback(async (callType) => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Calls need a secure (HTTPS) connection with camera and microphone access.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setCameraOn(callType === 'video');
    return stream;
  }, []);

  const buildPeer = useCallback(
    (callId) => {
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });

      localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setStatus('active');
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:signal', { callId, signal: { type: 'candidate', candidate: event.candidate } });
        }
      };
      pc.onconnectionstatechange = () => {
        if (['failed', 'closed'].includes(pc.connectionState)) {
          setError('The connection dropped.');
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [socket]
  );

  const flushCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // A candidate that no longer applies is safe to drop.
      }
    }
  }, []);

  // --- Public actions -------------------------------------------------------
  const startCall = useCallback(
    (peer, callType = 'video') => {
      if (!socket) return;
      setError('');
      setStatus('calling');
      const next = { callId: null, peerId: peer.userId, peerName: peer.name, callType, direction: 'outgoing' };
      callRef.current = next;
      setCall(next);
      socket.emit('call:invite', { toUserId: peer.userId, callType });
    },
    [socket]
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!socket || !current) return;
    try {
      await getMedia(current.callType);
      setStatus('connecting');
      socket.emit('call:accept', { callId: current.callId });
    } catch (err) {
      setError(err.message || 'Could not access your camera or microphone.');
      socket.emit('call:reject', { callId: current.callId });
      cleanup();
      setCall(null);
      setStatus('idle');
    }
  }, [socket, getMedia, cleanup]);

  const rejectCall = useCallback(() => {
    const current = callRef.current;
    if (socket && current?.callId) socket.emit('call:reject', { callId: current.callId });
    cleanup();
    setCall(null);
    setStatus('idle');
  }, [socket, cleanup]);

  const endCall = useCallback(() => {
    const current = callRef.current;
    if (socket && current?.callId) socket.emit('call:end', { callId: current.callId });
    cleanup();
    setCall(null);
    setStatus('idle');
  }, [socket, cleanup]);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    if (callRef.current?.callId) {
      socket?.emit('call:media-state', { callId: callRef.current.callId, micOn: track.enabled, cameraOn });
    }
  }, [socket, cameraOn]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
    if (callRef.current?.callId) {
      socket?.emit('call:media-state', { callId: callRef.current.callId, micOn, cameraOn: track.enabled });
    }
  }, [socket, micOn]);

  // --- Socket wiring --------------------------------------------------------
  useEffect(() => {
    if (!socket) return undefined;

    const onRinging = ({ callId }) => {
      if (!callRef.current) return;
      callRef.current = { ...callRef.current, callId };
      setCall(callRef.current);
    };

    const onIncoming = ({ callId, fromUserId, fromName, callType }) => {
      // Already busy — auto-decline instead of clobbering the live call.
      if (callRef.current) {
        socket.emit('call:reject', { callId });
        return;
      }
      const next = { callId, peerId: fromUserId, peerName: fromName, callType, direction: 'incoming' };
      callRef.current = next;
      setCall(next);
      setStatus('ringing');
    };

    // Both sides receive this. Only the caller creates the offer.
    const onAccepted = async ({ callId }) => {
      const current = callRef.current;
      if (!current || current.callId !== callId) return;
      if (current.direction !== 'outgoing') return;
      try {
        setStatus('connecting');
        await getMedia(current.callType);
        const pc = buildPeer(callId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:signal', { callId, signal: { type: 'offer', sdp: offer } });
      } catch (err) {
        setError(err.message || 'Could not start the call.');
        socket.emit('call:end', { callId });
      }
    };

    const onSignal = async ({ callId, signal }) => {
      const current = callRef.current;
      if (!current || current.callId !== callId) return;

      if (signal.type === 'offer') {
        const pc = pcRef.current || buildPeer(callId);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        await flushCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:signal', { callId, signal: { type: 'answer', sdp: answer } });
      } else if (signal.type === 'answer') {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        await flushCandidates();
      } else if (signal.type === 'candidate') {
        // Candidates can arrive before the remote description — queue them until it lands.
        if (!pcRef.current?.remoteDescription) {
          pendingCandidatesRef.current.push(signal.candidate);
          return;
        }
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch {
          /* stale candidate */
        }
      }
    };

    const onPeerMedia = ({ callId, micOn: m, cameraOn: c }) => {
      if (callRef.current?.callId !== callId) return;
      setPeerMedia({ micOn: m, cameraOn: c });
    };

    const onEnded = ({ callId, reason }) => {
      if (callRef.current && callRef.current.callId !== callId) return;
      cleanup();
      setCall(null);
      setStatus('idle');
      if (reason === 'declined') setError('Call declined.');
      else if (reason === 'no-answer') setError('No answer.');
      else if (reason === 'disconnected') setError('The other person lost connection.');
    };

    const onFailed = ({ reason }) => {
      cleanup();
      setCall(null);
      setStatus('idle');
      setError(reason === 'offline' ? 'They are offline right now.' : 'Could not place the call.');
    };

    socket.on('call:ringing', onRinging);
    socket.on('call:incoming', onIncoming);
    socket.on('call:accepted', onAccepted);
    socket.on('call:signal', onSignal);
    socket.on('call:media-state', onPeerMedia);
    socket.on('call:ended', onEnded);
    socket.on('call:failed', onFailed);

    return () => {
      socket.off('call:ringing', onRinging);
      socket.off('call:incoming', onIncoming);
      socket.off('call:accepted', onAccepted);
      socket.off('call:signal', onSignal);
      socket.off('call:media-state', onPeerMedia);
      socket.off('call:ended', onEnded);
      socket.off('call:failed', onFailed);
    };
  }, [socket, buildPeer, getMedia, flushCandidates, cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    call,
    status,
    localStream,
    remoteStream,
    error,
    micOn,
    cameraOn,
    peerMedia,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    dismissError: () => setError(''),
  };
};
