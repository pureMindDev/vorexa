const StudyGroup = require('../models/StudyGroup');
const PomodoroSession = require('../models/PomodoroSession');

// groupId (string) -> Map of userId -> { name, socketIds: Set }
// A room's "participants" are simply the study group's members who currently have the room open.
const roomParticipants = new Map();

const isMember = (group, userId) => group.members.some((m) => m.userId.toString() === userId.toString());

const getParticipantList = (groupId) => {
  const map = roomParticipants.get(groupId);
  if (!map) return [];
  return [...map.entries()].map(([userId, info]) => ({ userId, name: info.name }));
};

module.exports = (io, socket) => {
  const userId = socket.userId;
  const userName = socket.userName;
  // Track which rooms this socket has joined, so disconnect can clean them all up.
  const joinedRooms = new Set();

  socket.on('room:join', async ({ groupId }) => {
    try {
      const group = await StudyGroup.findById(groupId).select('members');
      if (!group || !isMember(group, userId)) return;

      socket.join(`studyroom:${groupId}`);
      joinedRooms.add(groupId);

      if (!roomParticipants.has(groupId)) roomParticipants.set(groupId, new Map());
      const participants = roomParticipants.get(groupId);
      if (!participants.has(userId)) participants.set(userId, { name: userName, socketIds: new Set() });
      participants.get(userId).socketIds.add(socket.id);

      io.to(`studyroom:${groupId}`).emit('room:participants', { groupId, participants: getParticipantList(groupId) });
    } catch {
      // best-effort
    }
  });

  socket.on('room:leave', ({ groupId }) => {
    socket.leave(`studyroom:${groupId}`);
    joinedRooms.delete(groupId);

    const participants = roomParticipants.get(groupId);
    const entry = participants?.get(userId);
    if (entry) {
      entry.socketIds.delete(socket.id);
      if (entry.socketIds.size === 0) participants.delete(userId);
    }

    io.to(`studyroom:${groupId}`).emit('room:participants', { groupId, participants: getParticipantList(groupId) });
  });

  socket.on('room:chat', ({ groupId, message }) => {
    if (!message?.trim() || !joinedRooms.has(groupId)) return;
    io.to(`studyroom:${groupId}`).emit('room:chat', {
      groupId,
      userId,
      name: userName,
      message: message.trim().slice(0, 500),
      at: new Date(),
    });
  });

  // Synced pomodoro timer — the server just relays a start timestamp + duration; every client
  // computes its own countdown from that, so no server-side ticking loop is needed.
  socket.on('room:timer:start', ({ groupId, type = 'focus', durationMinutes = 25 }) => {
    if (!joinedRooms.has(groupId)) return;
    io.to(`studyroom:${groupId}`).emit('room:timer:update', {
      groupId,
      status: 'running',
      type,
      durationMinutes,
      startedAt: new Date(),
      startedBy: userName,
    });
  });

  socket.on('room:timer:pause', ({ groupId }) => {
    if (!joinedRooms.has(groupId)) return;
    io.to(`studyroom:${groupId}`).emit('room:timer:update', { groupId, status: 'paused' });
  });

  socket.on('room:timer:reset', ({ groupId }) => {
    if (!joinedRooms.has(groupId)) return;
    io.to(`studyroom:${groupId}`).emit('room:timer:update', { groupId, status: 'idle' });
  });

  // Log a completed focus session for streak/stats purposes once a timer naturally finishes.
  socket.on('room:timer:complete', async ({ groupId, type = 'focus', durationMinutes = 25 }) => {
    try {
      await PomodoroSession.create({ userId, type, durationMinutes, roomId: groupId || null });
    } catch {
      // best-effort — a missed log shouldn't disrupt the room
    }
  });

  socket.on('disconnect', () => {
    joinedRooms.forEach((groupId) => {
      const participants = roomParticipants.get(groupId);
      const entry = participants?.get(userId);
      if (entry) {
        entry.socketIds.delete(socket.id);
        if (entry.socketIds.size === 0) participants.delete(userId);
      }
      io.to(`studyroom:${groupId}`).emit('room:participants', { groupId, participants: getParticipantList(groupId) });
    });
  });
};
