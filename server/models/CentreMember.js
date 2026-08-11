const mongoose = require('mongoose');

const centreMemberSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorialCentre',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Mirrors the invited user's platform role (tutor or student) — enforced at invite time.
    memberRole: {
      type: String,
      enum: ['tutor', 'student'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'declined', 'removed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

centreMemberSchema.index({ centreId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CentreMember', centreMemberSchema);
