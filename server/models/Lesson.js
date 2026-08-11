const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
