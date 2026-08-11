const mongoose = require('mongoose');

const sharedNoteSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
      default: 'Untitled note',
    },
    content: {
      type: String,
      default: '',
      maxlength: 20000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

sharedNoteSchema.index({ groupId: 1, updatedAt: -1 });

module.exports = mongoose.model('SharedNote', sharedNoteSchema);
