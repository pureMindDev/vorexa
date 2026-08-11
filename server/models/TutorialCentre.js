const mongoose = require('mongoose');

const tutorialCentreSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one centre profile per centre account, for now
    },
    name: {
      type: String,
      required: [true, 'Centre name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TutorialCentre', tutorialCentreSchema);
