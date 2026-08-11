const PomodoroSession = require('../models/PomodoroSession');

// @desc    Log a completed pomodoro session (solo — group sessions log via socket automatically)
// @route   POST /api/pomodoro/sessions
const logSession = async (req, res, next) => {
  try {
    const { type = 'focus', durationMinutes } = req.body;
    if (!durationMinutes || durationMinutes < 1) {
      return res.status(400).json({ message: 'A valid durationMinutes is required' });
    }
    if (!['focus', 'short_break', 'long_break'].includes(type)) {
      return res.status(400).json({ message: 'Invalid session type' });
    }

    const session = await PomodoroSession.create({ userId: req.user._id, type, durationMinutes });
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
};

// @desc    Today's + this-week's focus minutes, and recent session history
// @route   GET /api/pomodoro/stats
const getStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [todaySessions, weekSessions, recent] = await Promise.all([
      PomodoroSession.find({ userId: req.user._id, type: 'focus', completedAt: { $gte: startOfToday } }),
      PomodoroSession.find({ userId: req.user._id, type: 'focus', completedAt: { $gte: startOfWeek } }),
      PomodoroSession.find({ userId: req.user._id }).sort({ completedAt: -1 }).limit(20),
    ]);

    const sum = (arr) => arr.reduce((total, s) => total + s.durationMinutes, 0);

    res.json({
      todayFocusMinutes: sum(todaySessions),
      weekFocusMinutes: sum(weekSessions),
      todaySessionCount: todaySessions.length,
      recentSessions: recent,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { logSession, getStats };
