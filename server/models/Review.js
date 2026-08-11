const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

reviewSchema.index({ tutorId: 1, studentId: 1 }, { unique: true }); // one review per student per tutor

module.exports = mongoose.model('Review', reviewSchema);
