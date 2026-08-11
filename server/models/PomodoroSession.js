const mongoose = require('mongoose');

const pomodoroSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['focus', 'short_break', 'long_break'],
      default: 'focus',
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    // The study room this session happened in, if it was a synced group session rather than solo.
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      default: null,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

pomodoroSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('PomodoroSession', pomodoroSessionSchema);
