const express = require('express');
const router = express.Router();
const {
  completeOnboarding,
  getLeaderboard,
  getAchievements,
  getWeakTopics,
  getPublicProfile,
  toggleTwoFactor,
  getLoginHistory,
  updateProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.put('/onboarding', protect, completeOnboarding);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/achievements', protect, getAchievements);
router.get('/weak-topics', protect, getWeakTopics);
router.put('/2fa', protect, toggleTwoFactor);
router.get('/login-history', protect, getLoginHistory);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/:userId/public', protect, getPublicProfile);

module.exports = router;
