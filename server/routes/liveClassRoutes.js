const express = require('express');
const router = express.Router();
const {
  createLiveClass,
  getMyLiveClasses,
  getLiveClass,
  startLiveClass,
  endLiveClass,
  recordJoin,
  recordLeave,
  getAttendance,
} = require('../controllers/liveClassController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createLiveClass);
router.get('/', protect, getMyLiveClasses);
router.get('/:id', protect, getLiveClass);
router.put('/:id/start', protect, startLiveClass);
router.put('/:id/end', protect, endLiveClass);
router.post('/:id/attendance/join', protect, recordJoin);
router.post('/:id/attendance/leave', protect, recordLeave);
router.get('/:id/attendance', protect, getAttendance);

module.exports = router;
