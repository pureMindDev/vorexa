const mongoose = require('mongoose');

const accountabilityPartnershipSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'declined'],
      default: 'pending',
    },
    goal: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  { timestamps: true }
);

accountabilityPartnershipSchema.index({ userA: 1, userB: 1 });

module.exports = mongoose.model('AccountabilityPartnership', accountabilityPartnershipSchema);
