const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { notify } = require('../services/notificationService');
const { emitToUser, isUserOnline } = require('../config/socket');

const sortedPair = (a, b) => [a, b].map(String).sort();

// @desc    Get or create a conversation with another user
// @route   POST /api/messages/conversations/:userId
const startConversation = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;
    if (otherUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't message yourself" });
    }

    const participants = sortedPair(req.user._id, otherUserId);

    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = await Conversation.create({ participants });
    }

    res.json({ conversationId: conversation._id });
  } catch (error) {
    next(error);
  }
};

// @desc    List the logged-in user's conversations, most recent first
// @route   GET /api/messages/conversations
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name');

    res.json({
      conversations: conversations.map((c) => {
        const other = c.participants.find((p) => p._id.toString() !== req.user._id.toString());
        const lastReadAt = c.lastReadBy?.get(req.user._id.toString());
        const isUnread = c.lastMessageAt && (!lastReadAt || c.lastMessageAt > lastReadAt);

        return {
          id: c._id,
          otherUserId: other?._id,
          otherUserName: other?.name || 'Unknown user',
          otherUserOnline: isUserOnline(other?._id),
          lastMessagePreview: c.lastMessagePreview,
          lastMessageAt: c.lastMessageAt,
          isUnread,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages in a conversation (also marks it as read)
// @route   GET /api/messages/conversations/:conversationId
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(200);

    conversation.lastReadBy.set(req.user._id.toString(), new Date());
    await conversation.save();

    const otherUserId = conversation.participants.find((p) => p.toString() !== req.user._id.toString());
    const otherLastReadAt = conversation.lastReadBy?.get(otherUserId?.toString()) || null;

    // Tell the other participant this conversation was just opened/read, so their tick marks update live.
    emitToUser(otherUserId, 'message:read', {
      conversationId: conversation._id,
      readBy: req.user._id,
      readAt: new Date(),
    });

    res.json({
      otherUserId,
      otherUserOnline: isUserOnline(otherUserId),
      otherLastReadAt,
      messages: messages.map((m) => ({
        id: m._id,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
        reactions: m.reactions,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/messages/conversations/:conversationId
const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      content: content.trim(),
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview = content.trim().slice(0, 100);
    conversation.lastReadBy.set(req.user._id.toString(), new Date());
    await conversation.save();

    const otherUserId = conversation.participants.find((p) => p.toString() !== req.user._id.toString());

    const payload = {
      id: message._id,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      reactions: message.reactions,
    };

    // Live-push to the recipient's open tabs, and to the sender's other tabs/devices for sync.
    emitToUser(otherUserId, 'message:new', { conversationId: conversation._id, message: payload });
    emitToUser(req.user._id, 'message:new', { conversationId: conversation._id, message: payload });

    await notify({
      userId: otherUserId,
      type: 'new_message',
      title: `New message from ${req.user.name}`,
      message: content.trim().slice(0, 80),
      link: `/messages/${conversation._id}`,
    });

    res.status(201).json({ message: payload });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the total unread conversation count (for a badge)
// @route   GET /api/messages/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    const unreadCount = conversations.filter((c) => {
      const lastReadAt = c.lastReadBy?.get(req.user._id.toString());
      return c.lastMessageAt && (!lastReadAt || c.lastMessageAt > lastReadAt);
    }).length;

    res.json({ count: unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc    React to a message with an emoji (toggles — one reaction per user per message)
// @route   PUT /api/messages/:messageId/react
const toggleReaction = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const userIdStr = req.user._id.toString();
    const alreadyReactedSame = message.reactions.some(
      (r) => r.userId.toString() === userIdStr && r.emoji === emoji
    );

    // One reaction per user per message — picking a new emoji replaces the old one, clicking the same removes it.
    message.reactions = message.reactions.filter((r) => r.userId.toString() !== userIdStr);
    if (!alreadyReactedSame) {
      message.reactions.push({ userId: req.user._id, emoji });
    }
    await message.save();

    const otherUserId = conversation.participants.find((p) => p.toString() !== userIdStr);
    const payload = { conversationId: conversation._id, messageId: message._id, reactions: message.reactions };
    emitToUser(otherUserId, 'message:reaction', payload);
    emitToUser(req.user._id, 'message:reaction', payload);

    res.json({ reactions: message.reactions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  toggleReaction,
};
