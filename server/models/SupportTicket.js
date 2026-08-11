const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    adminReply: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
