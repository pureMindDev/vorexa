const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    provider: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['scholarship', 'competition', 'internship', 'other'],
      default: 'scholarship',
    },
    deadline: {
      type: Date,
      default: null,
    },
    link: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['interested', 'applied', 'awarded', 'rejected'],
      default: 'interested',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Opportunity', opportunitySchema);
