const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

calendarEventSchema.index({ userId: 1, eventDate: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
