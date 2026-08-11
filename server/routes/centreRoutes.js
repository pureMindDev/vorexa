const express = require('express');
const router = express.Router();
const {
  createCentre,
  getMyCentre,
  updateCentre,
  inviteMember,
  getMembers,
  removeMember,
  getMyInvites,
  respondToInvite,
  leaveCentre,
  createExam,
  setExamPublished,
  getExams,
  getExam,
  submitExam,
  getExamResults,
  getPerformanceReport,
  getCentrePayments,
} = require('../controllers/centreController');
const { protect } = require('../middleware/auth');

// Profile (centre owner)
router.post('/profile', protect, createCentre);
router.get('/profile', protect, getMyCentre);
router.put('/profile', protect, updateCentre);

// Member management (centre owner)
router.post('/members', protect, inviteMember);
router.get('/members', protect, getMembers);
router.delete('/members/:id', protect, removeMember);

// Invites (tutor/student side)
router.get('/my-invites', protect, getMyInvites);
router.put('/my-invites/:id', protect, respondToInvite);
router.delete('/my-invites/:id', protect, leaveCentre);

// Custom exams
router.post('/exams', protect, createExam);
router.get('/exams', protect, getExams);
router.get('/exams/:id', protect, getExam);
router.put('/exams/:id/publish', protect, setExamPublished);
router.post('/exams/:id/submit', protect, submitExam);
router.get('/exams/:id/results', protect, getExamResults);

// Reporting
router.get('/reports', protect, getPerformanceReport);
router.get('/payments', protect, getCentrePayments);

module.exports = router;
