const express = require('express');
const router = express.Router();
const { chat, chatStream, quiz, flashcards, summarize, essayFeedback, revisionPlan, getConversations, getConversationById, deleteConversation } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/chat', protect, upload.single('attachment'), chat);
router.post('/chat/stream', protect, chatStream);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversationById);
router.delete('/conversations/:id', protect, deleteConversation);
router.post('/quiz', protect, quiz);
router.post('/flashcards', protect, flashcards);
router.post('/summarize', protect, summarize);
router.post('/essay-feedback', protect, essayFeedback);
router.post('/revision-plan', protect, revisionPlan);

module.exports = router;
