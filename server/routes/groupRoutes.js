const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  createGroupPost,
} = require('../controllers/groupController');
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getDecks,
  createDeck,
  addCard,
  removeCard,
} = require('../controllers/collabController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/:id', protect, getGroupById);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);
router.get('/:id/posts', protect, getGroupPosts);
router.post('/:id/posts', protect, createGroupPost);

router.get('/:id/notes', protect, getNotes);
router.post('/:id/notes', protect, createNote);
router.put('/:id/notes/:noteId', protect, updateNote);
router.delete('/:id/notes/:noteId', protect, deleteNote);

router.get('/:id/flashcards', protect, getDecks);
router.post('/:id/flashcards', protect, createDeck);
router.post('/:id/flashcards/:deckId/cards', protect, addCard);
router.delete('/:id/flashcards/:deckId/cards/:cardId', protect, removeCard);

module.exports = router;
