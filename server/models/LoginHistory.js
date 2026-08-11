const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: 'Unknown device',
    },
  },
  { timestamps: true }
);

loginHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
