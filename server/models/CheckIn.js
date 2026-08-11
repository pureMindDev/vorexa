const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    partnershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccountabilityPartnership',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Check-in content is required'],
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

checkInSchema.index({ partnershipId: 1, createdAt: -1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
