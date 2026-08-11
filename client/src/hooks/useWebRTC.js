import { useState, useEffect, useRef, useCallback } from 'react';

// Public STUN only — there's no TURN server behind this, so peers on strict/symmetric NATs
// (common on some mobile carriers, corporate networks) may fail to connect directly.
// For production reliability at scale, a TURN service (or a proper SFU) would replace this mesh.
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

// Small-mesh WebRTC: every participant connects directly to every other participant.
// This is fine for study-group-sized calls (a handful of people); it doesn't scale to large
// lecture-style audiences without a media server, which is intentionally out of scope here.
export const useWebRTC = (socket, liveClassId, localStream) => {
  const [remoteStreams, setRemoteStreams] = useState({}); // userId -> { stream, name }
  const peerConnectionsRef = useRef({}); // userId -> RTCPeerConnection
  const localStreamRef = useRef(localStream);

  useEffect(() => {
    localStreamRef.current = localStream;
    // If tracks change (e.g. screen share swap) after connections already exist, replace them.
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const senders = pc.getSenders();
      localStream?.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) sender.replaceTrack(track);
      });
    });
  }, [localStream]);

  const createPeerConnection = useCallback(
    (peerUserId, peerName) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({ ...prev, [peerUserId]: { stream: event.streams[0], name: peerName } }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('live:signal', {
            liveClassId,
            toUserId: peerUserId,
            signal: { type: 'candidate', candidate: event.candidate },
          });
        }
      };

      peerConnectionsRef.current[peerUserId] = pc;
      return pc;
    },
    [socket, liveClassId]
  );

  const closePeer = useCallback((peerUserId) => {
    peerConnectionsRef.current[peerUserId]?.close();
    delete peerConnectionsRef.current[peerUserId];
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[peerUserId];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket || !liveClassId) return;

    // We're the newcomer — initiate an offer to each peer already in the room.
    const handlePeers = async ({ liveClassId: id, peers }) => {
      if (id !== liveClassId) return;
      for (const peer of peers) {
        const pc = createPeerConnection(peer.userId, peer.name);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('live:signal', {
          liveClassId,
          toUserId: peer.userId,
          signal: { type: 'offer', sdp: offer, name: undefined },
        });
      }
    };

    // A new peer joined after us — nothing to do yet, we just wait for their offer.
    const handlePeerJoined = () => {};

    const handleSignal = async ({ fromUserId, fromName, signal }) => {
      let pc = peerConnectionsRef.current[fromUserId];
      if (!pc) pc = createPeerConnection(fromUserId, fromName);

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('live:signal', { liveClassId, toUserId: fromUserId, signal: { type: 'answer', sdp: answer } });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === 'candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch {
          // candidates that arrive before the remote description is set are safely dropped
        }
      }
    };

    const handlePeerLeft = ({ userId }) => closePeer(userId);

    socket.on('live:peers', handlePeers);
    socket.on('live:peer-joined', handlePeerJoined);
    socket.on('live:signal', handleSignal);
    socket.on('live:peer-left', handlePeerLeft);

    return () => {
      socket.off('live:peers', handlePeers);
      socket.off('live:peer-joined', handlePeerJoined);
      socket.off('live:signal', handleSignal);
      socket.off('live:peer-left', handlePeerLeft);
    };
  }, [socket, liveClassId, createPeerConnection, closePeer]);

  // Full teardown on unmount
  useEffect(() => {
    return () => {
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
    };
  }, []);

  return { remoteStreams };
};
