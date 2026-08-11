const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  front: { type: String, required: true, trim: true, maxlength: 500 },
  back: { type: String, required: true, trim: true, maxlength: 500 },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const sharedFlashcardDeckSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Deck title is required'],
      trim: true,
      maxlength: 150,
    },
    cards: {
      type: [flashcardSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

sharedFlashcardDeckSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('SharedFlashcardDeck', sharedFlashcardDeckSchema);
