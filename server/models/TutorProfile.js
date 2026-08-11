const mongoose = require('mongoose');

const tutorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    subjects: {
      type: [String],
      default: [],
    },
    hourlyRate: {
      type: Number, // in Naira
      required: true,
      min: 0,
    },
    yearsExperience: {
      type: Number,
      default: 0,
    },
    sessionType: {
      type: String,
      enum: ['online', 'physical', 'both'],
      default: 'online',
    },
    isVerified: {
      type: Boolean,
      default: false, // set true by an admin later — no verification workflow yet
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TutorProfile', tutorProfileSchema);
