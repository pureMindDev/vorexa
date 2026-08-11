const express = require('express');
const router = express.Router();
const {
  createReminder, getReminders, deleteReminder,
  createGoal, getGoals, toggleGoal, deleteGoal,
  createEvent, deleteEvent,
  getCalendarMonth,
} = require('../controllers/productivityController');
const { protect } = require('../middleware/auth');

router.post('/reminders', protect, createReminder);
router.get('/reminders', protect, getReminders);
router.delete('/reminders/:id', protect, deleteReminder);

router.post('/goals', protect, createGoal);
router.get('/goals', protect, getGoals);
router.put('/goals/:id/toggle', protect, toggleGoal);
router.delete('/goals/:id', protect, deleteGoal);

router.post('/events', protect, createEvent);
router.delete('/events/:id', protect, deleteEvent);

router.get('/calendar', protect, getCalendarMonth);

module.exports = router;
