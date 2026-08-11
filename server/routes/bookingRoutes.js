const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookingsAsStudent,
  getMyBookingsAsTutor,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/as-student', protect, getMyBookingsAsStudent);
router.get('/as-tutor', protect, getMyBookingsAsTutor);
router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;
