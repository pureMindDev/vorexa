const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (arr) => arr.length === 2,
        message: 'A conversation must have exactly 2 participants',
      },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
    // Tracks when each participant last opened the conversation, for unread badges.
    lastReadBy: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
