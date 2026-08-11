const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    studentTypes: {
      // which onboarding student types this course is relevant for
      type: [String],
      enum: ['secondary_school', 'university', 'polytechnic', 'utme_aspirant'],
      default: [],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
