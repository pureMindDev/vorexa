const Reminder = require('../models/Reminder');
const Goal = require('../models/Goal');
const CalendarEvent = require('../models/CalendarEvent');
const Task = require('../models/Task');
const Opportunity = require('../models/Opportunity');

// ===== Reminders =====

const createReminder = async (req, res, next) => {
  try {
    const { title, remindAt } = req.body;
    if (!title?.trim() || !remindAt) {
      return res.status(400).json({ message: 'Title and reminder time are required' });
    }
    const reminder = await Reminder.create({ userId: req.user._id, title: title.trim(), remindAt });
    res.status(201).json({ reminder });
  } catch (error) {
    next(error);
  }
};

const getReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id }).sort({ remindAt: 1 });
    res.json({ reminders });
  } catch (error) {
    next(error);
  }
};

const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    next(error);
  }
};

// ===== Goals =====

const createGoal = async (req, res, next) => {
  try {
    const { title, description, targetDate } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Goal title is required' });
    }
    const goal = await Goal.create({
      userId: req.user._id,
      title: title.trim(),
      description: description || '',
      targetDate: targetDate || null,
    });
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ completed: 1, targetDate: 1, createdAt: -1 });
    res.json({ goals });
  } catch (error) {
    next(error);
  }
};

const toggleGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.completed = !goal.completed;
    goal.completedAt = goal.completed ? new Date() : null;
    await goal.save();

    res.json({ goal });
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};

// ===== Calendar events =====

const createEvent = async (req, res, next) => {
  try {
    const { title, eventDate, notes } = req.body;
    if (!title?.trim() || !eventDate) {
      return res.status(400).json({ message: 'Title and date are required' });
    }
    const event = await CalendarEvent.create({
      userId: req.user._id,
      title: title.trim(),
      eventDate,
      notes: notes || '',
    });
    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get everything with a date this month, merged from Tasks, Opportunities, and Events
// @route   GET /api/productivity/calendar?year=2026&month=7  (month is 1-12)
const getCalendarMonth = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [tasks, opportunities, events] = await Promise.all([
      Task.find({ userId: req.user._id, dueDate: { $gte: start, $lt: end } }),
      Opportunity.find({ userId: req.user._id, deadline: { $gte: start, $lt: end } }),
      CalendarEvent.find({ userId: req.user._id, eventDate: { $gte: start, $lt: end } }),
    ]);

    const items = [
      ...tasks.map((t) => ({ id: t._id, title: t.title, date: t.dueDate, type: 'task', completed: t.completed })),
      ...opportunities.map((o) => ({ id: o._id, title: o.title, date: o.deadline, type: 'opportunity' })),
      ...events.map((e) => ({ id: e._id, title: e.title, date: e.eventDate, type: 'event', notes: e.notes })),
    ];

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReminder, getReminders, deleteReminder,
  createGoal, getGoals, toggleGoal, deleteGoal,
  createEvent, deleteEvent,
  getCalendarMonth,
};
