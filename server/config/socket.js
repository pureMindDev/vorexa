const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

let io;

// userId (string) -> Set of live socket ids. A user can have multiple tabs/devices open,
// so we only treat them as "offline" once every socket has disconnected.
const onlineUsers = new Map();

const getOtherParticipantIds = async (userId) => {
  const conversations = await Conversation.find({ participants: userId }).select('participants');
  const ids = new Set();
  conversations.forEach((c) => {
    c.participants.forEach((p) => {
      const pid = p.toString();
      if (pid !== userId) ids.add(pid);
    });
  });
  return ids;
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Auth handshake — client connects with `auth: { token }`, same JWT used for REST calls.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name role status');
      if (!user) return next(new Error('User no longer exists'));
      if (user.status !== 'active') return next(new Error('Account is not active'));

      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    const sockets = onlineUsers.get(userId);
    const wasOffline = sockets.size === 0;
    sockets.add(socket.id);

    // Personal room — every notification/message push targets this room instead of a raw socket id.
    socket.join(`user:${userId}`);

    if (wasOffline) {
      const partnerIds = await getOtherParticipantIds(userId);
      partnerIds.forEach((pid) => io.to(`user:${pid}`).emit('presence:online', { userId }));
    }

    // Let a freshly-connected client know who among its chat partners is currently online.
    const partnerIds = await getOtherParticipantIds(userId);
    const onlinePartnerIds = [...partnerIds].filter((pid) => onlineUsers.has(pid));
    socket.emit('presence:snapshot', { onlineUserIds: onlinePartnerIds });

    require('../sockets/chatHandlers')(io, socket);
    require('../sockets/studyRoomHandlers')(io, socket);
    require('../sockets/liveClassHandlers')(io, socket);
    require('../sockets/callHandlers')(io, socket);

    socket.on('disconnect', async () => {
      const set = onlineUsers.get(userId);
      if (!set) return;
      set.delete(socket.id);
      if (set.size === 0) {
        onlineUsers.delete(userId);
        const partners = await getOtherParticipantIds(userId);
        partners.forEach((pid) => io.to(`user:${pid}`).emit('presence:offline', { userId, lastSeen: new Date() }));
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io has not been initialized yet');
  return io;
};

// Safe to call even if sockets aren't up (e.g. scripts run outside the server process).
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
};

const isUserOnline = (userId) => onlineUsers.has(userId?.toString());

module.exports = { initSocket, getIO, emitToUser, isUserOnline };
