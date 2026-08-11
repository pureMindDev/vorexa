const express = require('express');
const router = express.Router();
const {
  sendLinkRequest,
  getMyLinkRequests,
  getIncomingRequests,
  respondToLinkRequest,
  revokeLink,
  getMyChildren,
  getChildProgress,
  getChildAttendance,
  getChildPayments,
} = require('../controllers/parentController');
const { protect } = require('../middleware/auth');

// Linking — used by both parent (send/view own requests) and student (view/respond to incoming)
router.post('/link-requests', protect, sendLinkRequest);
router.get('/link-requests', protect, getMyLinkRequests);
router.get('/incoming-requests', protect, getIncomingRequests);
router.put('/link-requests/:id', protect, respondToLinkRequest);
router.delete('/link-requests/:id', protect, revokeLink);

// Parent dashboard — child data
router.get('/children', protect, getMyChildren);
router.get('/children/:studentId/progress', protect, getChildProgress);
router.get('/children/:studentId/attendance', protect, getChildAttendance);
router.get('/children/:studentId/payments', protect, getChildPayments);

module.exports = router;
