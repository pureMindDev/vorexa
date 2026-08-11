const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { getLevelInfo, getUserStats, BADGES } = require('../services/gamificationService');
const { computeSubjectAccuracy } = require('../services/analyticsService');

const VALID_STUDENT_TYPES = ['secondary_school', 'university', 'polytechnic', 'utme_aspirant'];

// @desc    Complete onboarding (student type, subjects, academic level)
// @route   PUT /api/users/onboarding
const completeOnboarding = async (req, res, next) => {
  try {
    const { studentType, subjects, academicLevel } = req.body;

    if (!studentType || !VALID_STUDENT_TYPES.includes(studentType)) {
      return res.status(400).json({ message: 'A valid student type is required' });
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Select at least one subject' });
    }
    if (!academicLevel || !academicLevel.trim()) {
      return res.status(400).json({ message: 'Academic level is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        studentType,
        subjects,
        academicLevel: academicLevel.trim(),
        onboardingCompleted: true,
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Onboarding completed',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentType: user.studentType,
        subjects: user.subjects,
        academicLevel: user.academicLevel,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the global XP leaderboard
// @route   GET /api/users/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const topUsers = await User.find({})
      .sort({ xp: -1 })
      .limit(limit)
      .select('name xp streakCount studentType');

    const leaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      id: u._id,
      name: u.name,
      xp: u.xp,
      streakCount: u.streakCount,
      studentType: u.studentType,
      isCurrentUser: u._id.toString() === req.user._id.toString(),
    }));

    // If the logged-in user isn't in the top N, work out their real rank separately
    const inTopList = leaderboard.some((entry) => entry.isCurrentUser);
    let currentUserRank = null;

    if (!inTopList) {
      const higherXpCount = await User.countDocuments({ xp: { $gt: req.user.xp } });
      currentUserRank = {
        rank: higherXpCount + 1,
        id: req.user._id,
        name: req.user.name,
        xp: req.user.xp,
        streakCount: req.user.streakCount,
        studentType: req.user.studentType,
        isCurrentUser: true,
      };
    }

    res.json({ leaderboard, currentUserRank });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  completeOnboarding,
  getLeaderboard,
  getAchievements,
  getWeakTopics,
  getPublicProfile,
  toggleTwoFactor,
  getLoginHistory,
  updateProfile,
  changePassword,
};

// @desc    Update basic profile fields (currently just display name)
// @route   PUT /api/users/profile
async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { name: name.trim() }, { new: true });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Change password — requires the current password to confirm
// @route   PUT /api/users/change-password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
}

// @desc    Enable or disable 2FA — requires current password to confirm
// @route   PUT /api/users/2fa
async function toggleTwoFactor(req, res, next) {
  try {
    const { enable, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Enter your password to confirm this change' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    user.twoFactorEnabled = !!enable;
    await user.save();

    res.json({ twoFactorEnabled: user.twoFactorEnabled });
  } catch (error) {
    next(error);
  }
}

// @desc    Get recent login history
// @route   GET /api/users/login-history
async function getLoginHistory(req, res, next) {
  try {
    const history = await LoginHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ history });
  } catch (error) {
    next(error);
  }
}

// @desc    Get another user's public profile (name, student type — no sensitive fields)
// @route   GET /api/users/:userId/public
async function getPublicProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.userId).select('name studentType xp streakCount');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

// @desc    Compute per-subject accuracy from the user's real CBT answer history
// @route   GET /api/users/weak-topics
async function getWeakTopics(req, res, next) {
  try {
    const result = await computeSubjectAccuracy(req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// @desc    Get the logged-in user's level, XP progress, and badge roster (earned + locked)
// @route   GET /api/users/achievements
async function getAchievements(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const stats = await getUserStats(req.user._id);
    const levelInfo = getLevelInfo(user.xp);
    const earnedKeys = new Set(user.badges.map((b) => b.key));

    const badges = BADGES.map((b) => {
      const earned = user.badges.find((eb) => eb.key === b.key);
      return {
        key: b.key,
        name: b.name,
        description: b.description,
        icon: b.icon,
        earned: earnedKeys.has(b.key),
        earnedAt: earned?.earnedAt || null,
      };
    });

    res.json({ level: levelInfo, stats, badges });
  } catch (error) {
    next(error);
  }
}
