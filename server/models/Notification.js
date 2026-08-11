const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'booking_request',
        'booking_accepted',
        'booking_declined',
        'booking_completed',
        'group_post',
        'badge_earned',
        'post_comment',
        'post_like',
        'new_follower',
        'new_message',
        'reminder',
        'system', // admin-originated notices: account status changes, tutor verification, support replies
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    link: {
      type: String, // frontend route to navigate to when clicked
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
