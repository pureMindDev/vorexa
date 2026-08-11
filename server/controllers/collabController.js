const StudyGroup = require('../models/StudyGroup');
const SharedNote = require('../models/SharedNote');
const SharedFlashcardDeck = require('../models/SharedFlashcardDeck');
const { emitToUser } = require('../config/socket');

const isMember = (group, userId) => group.members.some((m) => m.userId.toString() === userId.toString());

const requireMembership = async (groupId, userId) => {
  const group = await StudyGroup.findById(groupId);
  if (!group) return { error: 'Group not found', code: 404 };
  if (!isMember(group, userId)) return { error: 'Join this group to access this', code: 403 };
  return { group };
};

const broadcastToGroup = async (group, event, payload, exceptUserId) => {
  group.members.forEach((m) => {
    if (exceptUserId && m.userId.toString() === exceptUserId.toString()) return;
    emitToUser(m.userId, event, payload);
  });
};

// ===================== SHARED NOTES =====================

// @desc    List shared notes for a group
// @route   GET /api/groups/:id/notes
const getNotes = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const notes = await SharedNote.find({ groupId: group._id }).sort({ updatedAt: -1 });
    res.json({ notes });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a shared note
// @route   POST /api/groups/:id/notes
const createNote = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const { title, content } = req.body;
    const note = await SharedNote.create({
      groupId: group._id,
      title: title?.trim() || 'Untitled note',
      content: content || '',
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
    });

    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a shared note's content — last write wins, broadcast to the rest of the group live
// @route   PUT /api/groups/:id/notes/:noteId
const updateNote = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const { title, content } = req.body;
    const update = { lastEditedBy: req.user._id };
    if (title !== undefined) update.title = title.trim() || 'Untitled note';
    if (content !== undefined) update.content = content;

    const note = await SharedNote.findOneAndUpdate(
      { _id: req.params.noteId, groupId: group._id },
      update,
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });

    broadcastToGroup(group, 'note:updated', { note }, req.user._id);
    res.json({ note });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a shared note
// @route   DELETE /api/groups/:id/notes/:noteId
const deleteNote = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const note = await SharedNote.findOneAndDelete({ _id: req.params.noteId, groupId: group._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    broadcastToGroup(group, 'note:deleted', { noteId: note._id }, req.user._id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
};

// ===================== SHARED FLASHCARDS =====================

// @desc    List flashcard decks for a group
// @route   GET /api/groups/:id/flashcards
const getDecks = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const decks = await SharedFlashcardDeck.find({ groupId: group._id }).sort({ createdAt: -1 });
    res.json({ decks });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a flashcard deck
// @route   POST /api/groups/:id/flashcards
const createDeck = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Deck title is required' });

    const deck = await SharedFlashcardDeck.create({ groupId: group._id, title: title.trim(), createdBy: req.user._id });
    res.status(201).json({ deck });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a card to a shared deck
// @route   POST /api/groups/:id/flashcards/:deckId/cards
const addCard = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const { front, back } = req.body;
    if (!front?.trim() || !back?.trim()) {
      return res.status(400).json({ message: 'Both front and back are required' });
    }

    const deck = await SharedFlashcardDeck.findOne({ _id: req.params.deckId, groupId: group._id });
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    deck.cards.push({ front: front.trim(), back: back.trim(), addedBy: req.user._id });
    await deck.save();

    broadcastToGroup(group, 'deck:updated', { deckId: deck._id, cards: deck.cards }, req.user._id);
    res.status(201).json({ deck });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove a card from a shared deck
// @route   DELETE /api/groups/:id/flashcards/:deckId/cards/:cardId
const removeCard = async (req, res, next) => {
  try {
    const { error, code, group } = await requireMembership(req.params.id, req.user._id);
    if (error) return res.status(code).json({ message: error });

    const deck = await SharedFlashcardDeck.findOne({ _id: req.params.deckId, groupId: group._id });
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    deck.cards = deck.cards.filter((c) => c._id.toString() !== req.params.cardId);
    await deck.save();

    broadcastToGroup(group, 'deck:updated', { deckId: deck._id, cards: deck.cards }, req.user._id);
    res.json({ deck });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getDecks,
  createDeck,
  addCard,
  removeCard,
};
