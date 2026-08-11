const User = require('../models/User');
const Progress = require('../models/Progress');
const CBTAttempt = require('../models/CBTAttempt');
const { notify } = require('./notificationService');

const XP_REWARDS = {
  LESSON_COMPLETE: 20,
  CBT_SUBMIT: 30,
  AI_CHAT: 5,
};

const XP_PER_LEVEL = 100;

// ===== Badge definitions (static — no DB collection needed for a set this small) =====
const BADGES = [
  { key: 'first_step', name: 'First Step', description: 'Complete your first lesson', icon: '🎯', check: (s) => s.lessonsCompleted >= 1 },
  { key: 'bookworm', name: 'Bookworm', description: 'Complete 10 lessons', icon: '📚', check: (s) => s.lessonsCompleted >= 10 },
  { key: 'first_exam', name: 'First Exam', description: 'Complete your first CBT practice', icon: '📝', check: (s) => s.cbtCompleted >= 1 },
  { key: 'exam_regular', name: 'Exam Regular', description: 'Complete 10 CBT practice exams', icon: '📋', check: (s) => s.cbtCompleted >= 10 },
  { key: 'exam_ace', name: 'Exam Ace', description: 'Score 80% or higher on a CBT', icon: '🏆', check: (s) => s.bestCbtScore >= 80 },
  { key: 'streak_3', name: 'Warming Up', description: 'Reach a 3-day study streak', icon: '🔥', check: (s) => s.streakCount >= 3 },
  { key: 'streak_7', name: 'On Fire', description: 'Reach a 7-day study streak', icon: '🔥', check: (s) => s.streakCount >= 7 },
  { key: 'streak_30', name: 'Unstoppable', description: 'Reach a 30-day study streak', icon: '⚡', check: (s) => s.streakCount >= 30 },
  { key: 'xp_500', name: 'Rising Star', description: 'Earn 500 total XP', icon: '⭐', check: (s) => s.xp >= 500 },
  { key: 'xp_2000', name: 'XP Master', description: 'Earn 2,000 total XP', icon: '💎', check: (s) => s.xp >= 2000 },
  { key: 'curious_mind', name: 'Curious Mind', description: 'Ask the AI Tutor 10 questions', icon: '🤖', check: (s) => s.aiChatCount >= 10 },
];

const isSameDay = (a, b) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const isYesterday = (a, b) => {
  const yesterday = new Date(b);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(a, yesterday);
};

// Call whenever a user does something study-related.
// Awards XP and updates their streak based on lastActiveDate.
const recordActivity = async (userId, xpAmount = 0) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();

  if (!user.lastActiveDate) {
    user.streakCount = 1;
  } else if (isSameDay(user.lastActiveDate, now)) {
    // already active today — streak unchanged
  } else if (isYesterday(user.lastActiveDate, now)) {
    user.streakCount += 1;
  } else {
    user.streakCount = 1; // streak broken, restart
  }

  user.lastActiveDate = now;
  user.xp += xpAmount;

  await user.save();
  return user;
};

// Derives level + progress-to-next-level from total XP.
// Simple flat curve: every 100 XP is one level. Easy to tune later.
const getLevelInfo = (xp) => {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  return {
    level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    progressPercent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
  };
};

// Gathers the stats badges are evaluated against.
const getUserStats = async (userId) => {
  const user = await User.findById(userId);

  const [lessonsCompleted, cbtAttempts] = await Promise.all([
    Progress.countDocuments({ userId, completed: true }),
    CBTAttempt.find({ userId, submittedAt: { $ne: null } }).select('score'),
  ]);

  const bestCbtScore = cbtAttempts.reduce((max, a) => Math.max(max, a.score || 0), 0);

  return {
    xp: user.xp,
    streakCount: user.streakCount,
    lessonsCompleted,
    cbtCompleted: cbtAttempts.length,
    bestCbtScore,
    aiChatCount: user.aiChatCount,
  };
};

// Checks all badge criteria against current stats and awards any newly-earned ones.
// Returns the list of badges newly earned in this call (empty if none).
const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const stats = await getUserStats(userId);
  const earnedKeys = new Set(user.badges.map((b) => b.key));
  const newlyEarned = [];

  for (const badge of BADGES) {
    if (!earnedKeys.has(badge.key) && badge.check(stats)) {
      user.badges.push({ key: badge.key, earnedAt: new Date() });
      newlyEarned.push(badge);
    }
  }

  if (newlyEarned.length > 0) {
    await user.save();
    await Promise.all(
      newlyEarned.map((badge) =>
        notify({
          userId,
          type: 'badge_earned',
          title: `Badge unlocked: ${badge.name}`,
          message: badge.description,
          link: '/achievements',
        })
      )
    );
  }

  return newlyEarned;
};

const incrementAiChatCount = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { aiChatCount: 1 } });
};

module.exports = {
  recordActivity,
  getLevelInfo,
  getUserStats,
  checkAndAwardBadges,
  incrementAiChatCount,
  BADGES,
  XP_REWARDS,
};
