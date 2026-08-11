const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    examType: {
      type: String,
      enum: ['JAMB', 'WAEC', 'NECO', 'Post-UTME'],
      required: [true, 'Exam type is required'],
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length === 4,
        message: 'A question must have exactly 4 options',
      },
      required: true,
    },
    correctAnswer: {
      // index (0-3) into the options array
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, examType: 1 });

module.exports = mongoose.model('Question', questionSchema);
