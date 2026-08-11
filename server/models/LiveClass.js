const mongoose = require('mongoose');
const crypto = require('crypto');

const liveClassSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    // A live class is tied to exactly one of: a 1:1 tutor booking, a study group session,
    // or a tutorial centre class — never more than one.
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      default: null,
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorialCentre',
      default: null,
    },
    roomCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(5).toString('hex'),
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

liveClassSchema.index({ scheduledFor: 1 });

module.exports = mongoose.model('LiveClass', liveClassSchema);
