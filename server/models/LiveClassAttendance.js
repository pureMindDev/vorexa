const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    liveClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: Date,
  },
  { timestamps: true }
);

attendanceSchema.index({ liveClassId: 1, userId: 1 });

module.exports = mongoose.model('LiveClassAttendance', attendanceSchema);
