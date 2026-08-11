const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { isUserOnline } = require('../config/socket');

// @desc    Follow a user
// @route   POST /api/follow/:userId
const followUser = async (req, res, next) => {
  try {
    const targetId = req.params.userId;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const me = await User.findById(req.user._id);
    if (me.following.some((id) => id.toString() === targetId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    me.following.push(targetId);
    await me.save();

    await notify({
      userId: targetId,
      type: 'new_follower',
      title: 'New follower',
      message: `${req.user.name} started following you.`,
      link: `/users/${req.user._id}`,
    });

    res.json({ message: 'Followed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/follow/:userId
const unfollowUser = async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    const me = await User.findById(req.user._id);
    me.following = me.following.filter((id) => id.toString() !== targetId);
    await me.save();
    res.json({ message: 'Unfollowed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get follow stats (counts + whether the logged-in user follows this profile)
// @route   GET /api/follow/:userId/stats
const getFollowStats = async (req, res, next) => {
  try {
    const targetId = req.params.userId;

    const [followersCount, target, me] = await Promise.all([
      User.countDocuments({ following: targetId }),
      User.findById(targetId).select('following'),
      User.findById(req.user._id).select('following'),
    ]);

    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      followersCount,
      followingCount: target.following.length,
      isFollowing: me.following.some((id) => id.toString() === targetId),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List the people the logged-in user follows, with live online status
// @route   GET /api/follow/following
const getMyFollowing = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).select('following').populate('following', 'name');
    res.json({
      following: me.following.map((u) => ({ id: u._id, name: u.name, online: isUserOnline(u._id) })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { followUser, unfollowUser, getFollowStats, getMyFollowing };
