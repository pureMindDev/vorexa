const SupportTicket = require('../models/SupportTicket');

// @desc    Submit a new support ticket
// @route   POST /api/support/tickets
const createTicket = async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in user's own support tickets
// @route   GET /api/support/tickets
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTicket, getMyTickets };
