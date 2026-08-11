const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // 'YYYY-MM-DD' in the user's local sense — simplest reliable format for day comparisons
    required: true,
  },
});

habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
