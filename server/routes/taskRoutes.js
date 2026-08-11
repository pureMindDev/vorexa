const express = require('express');
const router = express.Router();
const { createTask, getTasks, toggleTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createTask);
router.get('/', protect, getTasks);
router.put('/:id/toggle', protect, toggleTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
