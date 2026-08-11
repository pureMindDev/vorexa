const express = require('express');
const router = express.Router();
const { logSession, getStats } = require('../controllers/pomodoroController');
const { protect } = require('../middleware/auth');

router.post('/sessions', protect, logSession);
router.get('/stats', protect, getStats);

module.exports = router;
