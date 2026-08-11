const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
    },
    icon: {
      type: String,
      default: '✅',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Habit', habitSchema);
