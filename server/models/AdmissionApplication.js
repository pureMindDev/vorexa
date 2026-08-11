const mongoose = require('mongoose');

const admissionApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    universityName: {
      type: String,
      required: [true, 'University name is required'],
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['applied', 'admitted', 'rejected', 'pending'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
