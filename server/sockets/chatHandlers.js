const Conversation = require('../models/Conversation');

// Ephemeral chat events that don't need a REST endpoint — typing and read receipts
// are cheap, frequent, and have no lasting value once delivered, so they live purely on the socket.
module.exports = (io, socket) => {
  const userId = socket.userId;

  const getOtherParticipant = async (conversationId) => {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).select('participants');
    if (!conversation) return null;
    return conversation.participants.find((p) => p.toString() !== userId);
  };

  socket.on('typing:start', async ({ conversationId }) => {
    try {
      const otherId = await getOtherParticipant(conversationId);
      if (otherId) io.to(`user:${otherId}`).emit('typing:update', { conversationId, userId, isTyping: true });
    } catch {
      // typing indicators are best-effort — never crash the socket over one
    }
  });

  socket.on('typing:stop', async ({ conversationId }) => {
    try {
      const otherId = await getOtherParticipant(conversationId);
      if (otherId) io.to(`user:${otherId}`).emit('typing:update', { conversationId, userId, isTyping: false });
    } catch {
      // best-effort
    }
  });

  socket.on('conversation:read', async ({ conversationId }) => {
    try {
      const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
      if (!conversation) return;

      const readAt = new Date();
      conversation.lastReadBy.set(userId, readAt);
      await conversation.save();

      const otherId = conversation.participants.find((p) => p.toString() !== userId);
      if (otherId) io.to(`user:${otherId}`).emit('message:read', { conversationId, readBy: userId, readAt });
    } catch {
      // best-effort
    }
  });
};
