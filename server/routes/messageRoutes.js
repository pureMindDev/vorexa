const express = require('express');
const router = express.Router();
const {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  toggleReaction,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, getConversations);
router.post('/conversations/:userId/start', protect, startConversation);
router.get('/conversations/:conversationId', protect, getMessages);
router.post('/conversations/:conversationId', protect, sendMessage);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:messageId/react', protect, toggleReaction);

module.exports = router;
