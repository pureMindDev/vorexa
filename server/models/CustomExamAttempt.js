const mongoose = require('mongoose');

const customExamAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomExam',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: {
      type: [
        {
          questionIndex: Number,
          selectedOption: Number,
        },
      ],
      default: [],
    },
    score: {
      type: Number, // percentage, 0-100
      default: null,
    },
    submittedAt: Date,
  },
  { timestamps: true }
);

customExamAttemptSchema.index({ examId: 1, studentId: 1 });

module.exports = mongoose.model('CustomExamAttempt', customExamAttemptSchema);
