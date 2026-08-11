const express = require('express');
const router = express.Router();
const { createHabit, getHabits, toggleHabitToday, deleteHabit } = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createHabit);
router.get('/', protect, getHabits);
router.put('/:id/toggle-today', protect, toggleHabitToday);
router.delete('/:id', protect, deleteHabit);

module.exports = router;
