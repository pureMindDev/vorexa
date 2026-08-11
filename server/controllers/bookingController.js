const Booking = require('../models/Booking');
const TutorProfile = require('../models/TutorProfile');
const { notify } = require('../services/notificationService');

// @desc    Request a booking with a tutor
// @route   POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { tutorId, subject, preferredTime, message } = req.body;

    if (!tutorId || !subject || !preferredTime) {
      return res.status(400).json({ message: 'tutorId, subject, and preferredTime are required' });
    }
    if (tutorId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't book yourself" });
    }

    const tutorProfile = await TutorProfile.findOne({ userId: tutorId });
    if (!tutorProfile) {
      return res.status(404).json({ message: 'This tutor does not have an active profile' });
    }

    const booking = await Booking.create({
      studentId: req.user._id,
      tutorId,
      subject,
      preferredTime,
      message: message || '',
      amount: tutorProfile.hourlyRate,
    });

    await notify({
      userId: tutorId,
      type: 'booking_request',
      title: 'New booking request',
      message: `${req.user.name} wants to book a ${subject} session with you.`,
      link: '/bookings',
    });

    res.status(201).json({ message: 'Booking request sent', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings the logged-in user made as a student
// @route   GET /api/bookings/as-student
const getMyBookingsAsStudent = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('tutorId', 'name');

    res.json({
      bookings: bookings.map((b) => ({
        id: b._id,
        tutorId: b.tutorId._id,
        tutorName: b.tutorId.name,
        subject: b.subject,
        preferredTime: b.preferredTime,
        message: b.message,
        status: b.status,
        amount: b.amount,
        isPaid: b.isPaid,
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking requests the logged-in user received as a tutor
// @route   GET /api/bookings/as-tutor
const getMyBookingsAsTutor = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tutorId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name');

    res.json({
      bookings: bookings.map((b) => ({
        id: b._id,
        studentId: b.studentId._id,
        studentName: b.studentId.name,
        subject: b.subject,
        preferredTime: b.preferredTime,
        message: b.message,
        status: b.status,
        amount: b.amount,
        isPaid: b.isPaid,
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tutor accepts, declines, or marks a booking completed
// @route   PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, tutorId: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    const statusMessages = {
      accepted: `${req.user.name} accepted your ${booking.subject} booking request.`,
      declined: `${req.user.name} declined your ${booking.subject} booking request.`,
      completed: `Your ${booking.subject} session with ${req.user.name} was marked completed.`,
    };
    const notificationTypes = { accepted: 'booking_accepted', declined: 'booking_declined', completed: 'booking_completed' };

    await notify({
      userId: booking.studentId,
      type: notificationTypes[status],
      title: `Booking ${status}`,
      message: statusMessages[status],
      link: '/bookings',
    });

    res.json({ message: `Booking marked as ${status}`, booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookingsAsStudent, getMyBookingsAsTutor, updateBookingStatus };
