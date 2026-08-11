const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

const toDateString = (date) => date.toISOString().slice(0, 10); // 'YYYY-MM-DD'

// Counts consecutive days (ending today or yesterday) that have a log entry.
const computeStreak = (loggedDates) => {
  const dateSet = new Set(loggedDates);
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);

  // If today isn't logged yet, start counting from yesterday instead —
  // otherwise a still-unmarked today would incorrectly zero out an active streak.
  if (!dateSet.has(toDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateSet.has(toDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

// @desc    Create a habit
// @route   POST /api/habits
const createHabit = async (req, res, next) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await Habit.create({ userId: req.user._id, name: name.trim(), icon: icon || '✅' });
    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in user's habits with today's status and current streak
// @route   GET /api/habits
const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: 1 });
    const today = toDateString(new Date());

    const habitsWithStatus = await Promise.all(
      habits.map(async (habit) => {
        const logs = await HabitLog.find({ habitId: habit._id }).select('date');
        const loggedDates = logs.map((l) => l.date);

        return {
          id: habit._id,
          name: habit.name,
          icon: habit.icon,
          doneToday: loggedDates.includes(today),
          streak: computeStreak(loggedDates),
        };
      })
    );

    res.json({ habits: habitsWithStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle today's completion for a habit
// @route   PUT /api/habits/:id/toggle-today
const toggleHabitToday = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const today = toDateString(new Date());
    const existing = await HabitLog.findOne({ habitId: habit._id, date: today });

    if (existing) {
      await HabitLog.findByIdAndDelete(existing._id);
    } else {
      await HabitLog.create({ habitId: habit._id, userId: req.user._id, date: today });
    }

    const logs = await HabitLog.find({ habitId: habit._id }).select('date');
    const loggedDates = logs.map((l) => l.date);

    res.json({ doneToday: !existing, streak: computeStreak(loggedDates) });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    await HabitLog.deleteMany({ habitId: req.params.id });
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createHabit, getHabits, toggleHabitToday, deleteHabit };
