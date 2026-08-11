const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New chat',
    },
    messages: [
      {
        role: { type: String, enum: ['user', 'ai'], required: true },
        content: { type: String, required: true },
        hasAttachment: { type: Boolean, default: false },
        attachmentName: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
