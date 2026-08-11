const Task = require('../models/Task');

// @desc    Create a task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, subject, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await Task.create({
      userId: req.user._id,
      title: title.trim(),
      subject: subject || '',
      dueDate: dueDate || null,
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in user's tasks
// @route   GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ completed: 1, dueDate: 1, createdAt: -1 });
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle a task's completed state
// @route   PUT /api/tasks/:id/toggle
const toggleTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, toggleTask, deleteTask };
