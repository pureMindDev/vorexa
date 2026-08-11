const express = require('express');
const router = express.Router();
const {
  getSubjects,
  startExam,
  resumeAttempt,
  saveAnswers,
  submitExam,
  getAttemptReview,
  getResults,
  getAnalytics,
} = require('../controllers/cbtController');
const { protect } = require('../middleware/auth');

router.get('/subjects', protect, getSubjects);
router.get('/results', protect, getResults);
router.get('/analytics', protect, getAnalytics);
router.post('/start', protect, startExam);
router.get('/:attemptId/resume', protect, resumeAttempt);
router.patch('/:attemptId/answers', protect, saveAnswers);
router.post('/:attemptId/submit', protect, submitExam);
router.get('/:attemptId/review', protect, getAttemptReview);

module.exports = router;
