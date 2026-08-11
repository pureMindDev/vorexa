const LiveClass = require('../models/LiveClass');
const { resolveAccess } = require('../controllers/liveClassController');

// liveClassId (string) -> Map of userId -> { name, socketIds: Set }
// Mirrors the study room presence pattern — small-scale mesh video doesn't need a server-side
// media pipeline, just a signaling relay and a shared participant roster.
const roomPeers = new Map();

const getPeerList = (liveClassId) => {
  const map = roomPeers.get(liveClassId);
  if (!map) return [];
  return [...map.entries()].map(([userId, info]) => ({ userId, name: info.name }));
};

module.exports = (io, socket) => {
  const userId = socket.userId;
  const userName = socket.userName;
  const joinedClasses = new Set();

  const checkAccess = async (liveClassId) => {
    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) return false;
    const { allowed } = await resolveAccess(liveClass, userId);
    return allowed;
  };

  // `live:join` does an async DB access before a liveClassId lands in `joinedClasses`. If a
  // client sends a chat/reaction/etc. in that short window (very possible on a slower mobile
  // connection, right after opening the room), the old code silently dropped it — no error,
  // no echo, message just vanishes. This re-checks access and self-heals the room membership
  // instead of trusting only the flag that a prior async call already set.
  const ensureJoined = async (liveClassId) => {
    if (joinedClasses.has(liveClassId)) return true;
    const allowed = await checkAccess(liveClassId);
    if (!allowed) return false;
    socket.join(`live:${liveClassId}`);
    joinedClasses.add(liveClassId);
    return true;
  };

  // --- Room presence + WebRTC signaling ---
  socket.on('live:join', async ({ liveClassId }) => {
    try {
      const allowed = await checkAccess(liveClassId);
      if (!allowed) {
        socket.emit('live:join-denied', { liveClassId, reason: 'not-authorized' });
        return;
      }

      socket.join(`live:${liveClassId}`);
      joinedClasses.add(liveClassId);

      if (!roomPeers.has(liveClassId)) roomPeers.set(liveClassId, new Map());
      const peers = roomPeers.get(liveClassId);
      const existingPeers = getPeerList(liveClassId); // snapshot before adding self

      if (!peers.has(userId)) peers.set(userId, { name: userName, socketIds: new Set() });
      peers.get(userId).socketIds.add(socket.id);

      // Tell the newcomer who's already in the room so it can initiate WebRTC offers to each.
      socket.emit('live:peers', { liveClassId, peers: existingPeers });
      // Tell everyone else a new peer joined, so they wait for its offer.
      socket.to(`live:${liveClassId}`).emit('live:peer-joined', { liveClassId, userId, name: userName });
    } catch (err) {
      socket.emit('live:join-denied', { liveClassId, reason: 'error' });
    }
  });

  socket.on('live:leave', ({ liveClassId }) => {
    socket.leave(`live:${liveClassId}`);
    joinedClasses.delete(liveClassId);

    const peers = roomPeers.get(liveClassId);
    const entry = peers?.get(userId);
    if (entry) {
      entry.socketIds.delete(socket.id);
      if (entry.socketIds.size === 0) peers.delete(userId);
    }
    io.to(`live:${liveClassId}`).emit('live:peer-left', { liveClassId, userId });
  });

  // Host-only: forcibly remove a participant. We re-check hostId server-side rather than
  // trusting the client's "isHost" flag, since that's just UI state that could be spoofed.
  socket.on('live:kick', async ({ liveClassId, targetUserId }) => {
    try {
      const liveClass = await LiveClass.findById(liveClassId).select('hostId');
      if (!liveClass || liveClass.hostId.toString() !== userId.toString()) return;

      const peers = roomPeers.get(liveClassId);
      const target = peers?.get(targetUserId);
      if (!target) return;

      target.socketIds.forEach((sid) => {
        io.to(sid).emit('live:kicked', { liveClassId });
        io.sockets.sockets.get(sid)?.leave(`live:${liveClassId}`);
      });
      peers.delete(targetUserId);

      io.to(`live:${liveClassId}`).emit('live:peer-left', { liveClassId, userId: targetUserId });
    } catch {
      // best-effort
    }
  });

  // Pure relay — the server never inspects SDP/ICE payloads, just forwards them to the target peer.
  socket.on('live:signal', ({ liveClassId, toUserId, signal }) => {
    if (!joinedClasses.has(liveClassId)) return;
    const peers = roomPeers.get(liveClassId);
    const target = peers?.get(toUserId);
    if (!target) return;
    target.socketIds.forEach((sid) => {
      io.to(sid).emit('live:signal', { liveClassId, fromUserId: userId, fromName: userName, signal });
    });
  });

  // --- In-session chat (ephemeral — the persistent group/booking chat already exists elsewhere) ---
  socket.on('live:chat', async ({ liveClassId, message }) => {
    if (!message?.trim() || !(await ensureJoined(liveClassId))) return;
    io.to(`live:${liveClassId}`).emit('live:chat', {
      liveClassId,
      userId,
      name: userName,
      message: message.trim().slice(0, 500),
      at: new Date(),
    });
  });

  // --- Reactions + raise hand ---
  socket.on('live:reaction', async ({ liveClassId, emoji }) => {
    if (!(await ensureJoined(liveClassId))) return;
    io.to(`live:${liveClassId}`).emit('live:reaction', { liveClassId, userId, name: userName, emoji });
  });

  socket.on('live:hand', async ({ liveClassId, raised }) => {
    if (!(await ensureJoined(liveClassId))) return;
    io.to(`live:${liveClassId}`).emit('live:hand', { liveClassId, userId, name: userName, raised });
  });

  // --- Collaborative whiteboard — broadcast-only, no persistence. Late joiners get a state
  // dump from an existing peer via 'whiteboard:request-state' rather than the server storing it,
  // which keeps the server stateless for what could otherwise be a large, ever-growing canvas log.
  socket.on('whiteboard:draw', ({ liveClassId, stroke }) => {
    if (!joinedClasses.has(liveClassId)) return;
    socket.to(`live:${liveClassId}`).emit('whiteboard:draw', { stroke });
  });

  socket.on('whiteboard:clear', ({ liveClassId }) => {
    if (!joinedClasses.has(liveClassId)) return;
    io.to(`live:${liveClassId}`).emit('whiteboard:clear');
  });

  socket.on('whiteboard:request-state', ({ liveClassId }) => {
    if (!joinedClasses.has(liveClassId)) return;
    // Ask whichever peer has been in the room longest to reply with a full snapshot.
    socket.to(`live:${liveClassId}`).emit('whiteboard:state-requested', { requesterId: userId });
  });

  socket.on('whiteboard:state-response', ({ liveClassId, toUserId, strokes }) => {
    const peers = roomPeers.get(liveClassId);
    const target = peers?.get(toUserId);
    target?.socketIds.forEach((sid) => io.to(sid).emit('whiteboard:state-sync', { strokes }));
  });

  // --- Live quiz — host pushes a question, students answer, host sees a live tally.
  // Ephemeral by design: no need to persist pop quiz results the way graded CBT attempts are.
  socket.on('quiz:push', ({ liveClassId, question, options }) => {
    if (!joinedClasses.has(liveClassId)) return;
    socket.to(`live:${liveClassId}`).emit('quiz:new', { question, options, pushedAt: new Date() });
  });

  socket.on('quiz:answer', ({ liveClassId, optionIndex }) => {
    if (!joinedClasses.has(liveClassId)) return;
    io.to(`live:${liveClassId}`).emit('quiz:answer', { userId, name: userName, optionIndex });
  });

  socket.on('quiz:end', ({ liveClassId }) => {
    if (!joinedClasses.has(liveClassId)) return;
    io.to(`live:${liveClassId}`).emit('quiz:ended');
  });

  socket.on('disconnect', () => {
    joinedClasses.forEach((liveClassId) => {
      const peers = roomPeers.get(liveClassId);
      const entry = peers?.get(userId);
      if (entry) {
        entry.socketIds.delete(socket.id);
        if (entry.socketIds.size === 0) peers.delete(userId);
      }
      io.to(`live:${liveClassId}`).emit('live:peer-left', { liveClassId, userId });
    });
  });
};
