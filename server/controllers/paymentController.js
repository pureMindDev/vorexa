const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { notify } = require('../services/notificationService');
const { recordActivity, XP_REWARDS } = require('../services/gamificationService');

// Vorexa settles payments over WhatsApp instead of an online gateway.
// The API still records every payment so the student, the tutor and the admin
// all have an auditable trail — an admin marks the record as paid once the
// transfer lands.
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '2347017470501';

const buildWhatsAppUrl = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// @desc    Create a pending payment record for an accepted booking and hand
//          the student a prefilled WhatsApp link to complete it
// @route   POST /api/payments/request
const requestPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, studentId: req.user._id }).populate('tutorId', 'name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'This booking must be accepted by the tutor before you can pay' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'This booking has already been paid for' });
    }

    // Reuse an existing pending record so a student who clicks twice does not
    // create two references for the same session.
    let payment = await Payment.findOne({ bookingId: booking._id, status: 'pending' });
    if (!payment) {
      payment = await Payment.create({
        studentId: req.user._id,
        tutorId: booking.tutorId?._id || booking.tutorId,
        bookingId: booking._id,
        amount: booking.amount,
        reference: `vorexa_${bookingId}_${crypto.randomBytes(4).toString('hex')}`,
        status: 'pending',
      });
    }

    const message = `Hi! I'd like to pay for my Vorexa session.\n\nStudent: ${req.user.name}\nTutor: ${booking.tutorId?.name || 'Tutor'}\nSubject: ${booking.subject}\nAmount: NGN ${booking.amount?.toLocaleString()}\nReference: ${payment.reference}`;

    res.json({ whatsappUrl: buildWhatsAppUrl(message), reference: payment.reference });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a prefilled WhatsApp link for a subscription/plan upgrade
// @route   GET /api/payments/upgrade-link
const getUpgradeLink = async (req, res, next) => {
  try {
    const message = `Hi! I'd like to upgrade my Vorexa plan.\n\nName: ${req.user.name}\nEmail: ${req.user.email}`;
    res.json({ whatsappUrl: buildWhatsAppUrl(message) });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin confirms a payment received over WhatsApp
// @route   PUT /api/payments/:id/confirm
const confirmPayment = async (req, res, next) => {
  try {
    const { status = 'success' } = req.body;
    if (!['success', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be success or failed' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.status === 'success') {
      return res.json({ message: 'Payment already confirmed', payment });
    }

    payment.status = status;
    await payment.save();

    if (status === 'success') {
      const booking = await Booking.findByIdAndUpdate(payment.bookingId, { isPaid: true }, { new: true });

      await notify({
        userId: payment.tutorId,
        type: 'booking_accepted',
        title: 'Payment received',
        message: `A student paid ₦${payment.amount.toLocaleString()} for your ${booking?.subject || ''} session.`,
        link: '/tutor/bookings',
      });

      await notify({
        userId: payment.studentId,
        type: 'booking_accepted',
        title: 'Payment confirmed',
        message: `Your payment of ₦${payment.amount.toLocaleString()} has been confirmed. Your session is booked.`,
        link: '/bookings',
      });

      await recordActivity(payment.studentId, XP_REWARDS.CBT_SUBMIT);
    }

    res.json({ message: 'Payment updated', payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in student's payment history
// @route   GET /api/payments/mine
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('tutorId', 'name');

    res.json({
      payments: payments.map((p) => ({
        id: p._id,
        tutorName: p.tutorId?.name || 'Unknown tutor',
        amount: p.amount,
        status: p.status,
        reference: p.reference,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestPayment, getUpgradeLink, confirmPayment, getMyPayments };
