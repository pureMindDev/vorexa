const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

const notify = async ({ userId, type, title, message = '', link = '' }) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, link });
    // Push it live to any open tab — the client falls back to polling if it missed this.
    emitToUser(userId, 'notification:new', notification);
    return notification;
  } catch (error) {
    // Notifications are a nice-to-have — never let a failure here break the calling action
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = { notify };
