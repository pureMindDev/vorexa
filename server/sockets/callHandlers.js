const Conversation = require('../models/Conversation');
const { emitToUser, isUserOnline } = require('../config/socket');

// One-to-one WebRTC call signaling for direct messages.
//
// The server never touches media — it only relays offer/answer/ICE between exactly two
// users, and only if they already share a conversation (so nobody can cold-call a stranger).
// Group calls live in liveClassHandlers.js; this file is deliberately the 1:1 path only.

// callId -> { callerId, calleeId, conversationId, callType, createdAt, answered }
const activeCalls = new Map();

// Unanswered calls stop ringing after this long, on both ends.
const RING_TIMEOUT_MS = 45 * 1000;

const makeCallId = () => `call_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const canReach = async (userId, otherUserId) => {
  if (!otherUserId || userId === String(otherUserId)) return false;
  const convo = await Conversation.findOne({ participants: { $all: [userId, otherUserId] } }).select('_id');
  return convo ? convo._id.toString() : null;
};

const otherPartyOf = (call, userId) => (call.callerId === userId ? call.calleeId : call.callerId);

module.exports = (io, socket) => {
  const userId = socket.userId;
  const userName = socket.userName;
  const timers = new Map();

  const clearTimer = (callId) => {
    const t = timers.get(callId);
    if (t) clearTimeout(t);
    timers.delete(callId);
  };

  const endCall = (callId, reason) => {
    const call = activeCalls.get(callId);
    if (!call) return;
    activeCalls.delete(callId);
    clearTimer(callId);
    emitToUser(call.callerId, 'call:ended', { callId, reason });
    emitToUser(call.calleeId, 'call:ended', { callId, reason });
  };

  // --- Caller starts ringing ---
  socket.on('call:invite', async ({ toUserId, callType = 'video' }) => {
    try {
      const conversationId = await canReach(userId, toUserId);
      if (!conversationId) {
        socket.emit('call:failed', { reason: 'not-allowed' });
        return;
      }
      if (!isUserOnline(toUserId)) {
        socket.emit('call:failed', { reason: 'offline' });
        return;
      }

      const callId = makeCallId();
      activeCalls.set(callId, {
        callerId: userId,
        calleeId: String(toUserId),
        conversationId,
        callType: callType === 'audio' ? 'audio' : 'video',
        createdAt: Date.now(),
        answered: false,
      });

      socket.emit('call:ringing', { callId, toUserId, callType });
      emitToUser(toUserId, 'call:incoming', {
        callId,
        fromUserId: userId,
        fromName: userName,
        conversationId,
        callType,
      });

      timers.set(
        callId,
        setTimeout(() => {
          const call = activeCalls.get(callId);
          if (call && !call.answered) endCall(callId, 'no-answer');
        }, RING_TIMEOUT_MS)
      );
    } catch {
      socket.emit('call:failed', { reason: 'error' });
    }
  });

  // --- Callee picks up: the caller is told to create the WebRTC offer ---
  socket.on('call:accept', ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || call.calleeId !== userId) return;
    call.answered = true;
    clearTimer(callId);
    emitToUser(call.callerId, 'call:accepted', { callId, byUserId: userId });
    socket.emit('call:accepted', { callId, byUserId: userId });
  });

  socket.on('call:reject', ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || (call.calleeId !== userId && call.callerId !== userId)) return;
    endCall(callId, call.answered ? 'ended' : 'declined');
  });

  socket.on('call:end', ({ callId }) => {
    const call = activeCalls.get(callId);
    if (!call || (call.calleeId !== userId && call.callerId !== userId)) return;
    endCall(callId, 'ended');
  });

  // --- Pure relay: SDP + ICE candidates, scoped to the two call participants ---
  socket.on('call:signal', ({ callId, signal }) => {
    const call = activeCalls.get(callId);
    if (!call) return;
    if (call.callerId !== userId && call.calleeId !== userId) return;
    emitToUser(otherPartyOf(call, userId), 'call:signal', { callId, fromUserId: userId, signal });
  });

  // Media state (mic/cam toggles) so each side can label the other's tile correctly.
  socket.on('call:media-state', ({ callId, micOn, cameraOn }) => {
    const call = activeCalls.get(callId);
    if (!call || (call.callerId !== userId && call.calleeId !== userId)) return;
    emitToUser(otherPartyOf(call, userId), 'call:media-state', { callId, fromUserId: userId, micOn, cameraOn });
  });

  socket.on('disconnect', () => {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    // Deferred by a tick: the presence registry is cleaned up in its own disconnect handler,
    // so checking immediately would always still see this user as online. We also only tear
    // the call down if no other socket (second tab, phone) is left for them.
    setTimeout(() => {
      if (isUserOnline(userId)) return;
      [...activeCalls.entries()].forEach(([callId, call]) => {
        if (call.callerId === userId || call.calleeId === userId) endCall(callId, 'disconnected');
      });
    }, 1000);
  });
};
