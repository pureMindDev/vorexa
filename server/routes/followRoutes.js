const express = require('express');
const router = express.Router();
const { followUser, unfollowUser, getFollowStats, getMyFollowing } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

router.get('/following', protect, getMyFollowing);
router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);
router.get('/:userId/stats', protect, getFollowStats);

module.exports = router;
