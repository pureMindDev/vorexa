const mongoose = require('mongoose');

const parentChildLinkSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'revoked'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

parentChildLinkSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('ParentChildLink', parentChildLinkSchema);
