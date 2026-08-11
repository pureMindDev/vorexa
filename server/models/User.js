const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'tutor', 'admin', 'parent', 'centre'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },

    // Onboarding
    studentType: {
      type: String,
      enum: ['secondary_school', 'university', 'polytechnic', 'utme_aspirant', null],
      default: null,
    },
    subjects: {
      type: [String],
      default: [],
    },
    academicLevel: {
      type: String,
      default: null,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    dreamUniversity: {
      type: String,
      default: '',
    },
    dreamCourse: {
      type: String,
      default: '',
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: String,
    twoFactorCodeExpires: Date,

    // Email verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    verificationCodeExpires: Date,

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Gamification
    xp: {
      type: Number,
      default: 0,
    },
    streakCount: {
      type: Number,
      default: 0,
    },
    lastActiveDate: Date,
    badges: {
      type: [
        {
          key: String,
          earnedAt: Date,
        },
      ],
      default: [],
    },
    aiChatCount: {
      type: Number,
      default: 0,
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
