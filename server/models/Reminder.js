const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true,
    },
    remindAt: {
      type: Date,
      required: [true, 'Reminder time is required'],
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reminderSchema.index({ remindAt: 1, notified: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
