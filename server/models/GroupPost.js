const mongoose = require('mongoose');

const groupPostSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

groupPostSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('GroupPost', groupPostSchema);
