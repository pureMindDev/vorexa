const mongoose = require('mongoose');

const gpaRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semesterLabel: {
      type: String,
      required: [true, 'Semester label is required'], // e.g. "100 Level, First Semester"
      trim: true,
    },
    gpa: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GpaRecord', gpaRecordSchema);
