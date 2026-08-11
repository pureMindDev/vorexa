const mongoose = require('mongoose');

const cbtAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examType: {
      type: String,
      required: true,
    },
    subjects: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 4,
        message: 'Select between 1 and 4 subjects',
      },
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: Number, // index 0-3, null if unanswered
        isCorrect: { type: Boolean, default: null },
        subject: String,
        // Seconds the student spent on this question — powers the pacing analytics.
        timeSpentSeconds: { type: Number, default: null },
      },
    ],
    // Per-subject grading snapshot, computed once at submit time so analytics never
    // has to re-join against the Question collection.
    subjectBreakdown: [
      {
        subject: String,
        correct: Number,
        total: Number,
      },
    ],
    // Total allowed time for the sitting. Enforced server-side at submit so a student
    // can't win extra minutes by pausing the client-side timer.
    durationSeconds: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    autoSubmitted: { type: Boolean, default: false },
    score: {
      type: Number,
      default: null,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: Date,
  },
  { timestamps: true }
);

cbtAttemptSchema.index({ userId: 1, submittedAt: -1 });
cbtAttemptSchema.index({ userId: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model('CBTAttempt', cbtAttemptSchema);
