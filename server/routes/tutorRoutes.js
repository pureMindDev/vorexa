const express = require('express');
const router = express.Router();
const {
  getTutors,
  getTutorById,
  getMyTutorProfile,
  upsertMyTutorProfile,
  createReview,
  getDashboardStats,
} = require('../controllers/tutorController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTutors);
router.get('/me/profile', protect, getMyTutorProfile);
router.put('/me/profile', protect, upsertMyTutorProfile);
router.get('/me/dashboard-stats', protect, getDashboardStats);
router.get('/:userId', protect, getTutorById);
router.post('/:userId/reviews', protect, createReview);

module.exports = router;
