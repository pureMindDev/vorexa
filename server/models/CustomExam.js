const mongoose = require('mongoose');

const customQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  options: {
    type: [String],
    validate: { validator: (arr) => arr.length === 4, message: 'A question must have exactly 4 options' },
    required: true,
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '', trim: true },
});

const customExamSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorialCentre',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    questions: {
      type: [customQuestionSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

customExamSchema.index({ centreId: 1, createdAt: -1 });

module.exports = mongoose.model('CustomExam', customExamSchema);
