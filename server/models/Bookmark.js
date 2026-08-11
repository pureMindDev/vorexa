const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null, // null = bookmarking the whole course, not a specific lesson
    },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
