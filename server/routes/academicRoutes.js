const express = require('express');
const router = express.Router();
const {
  updateDreamGoal,
  getExamProgress,
  createAdmission,
  getAdmissions,
  updateAdmission,
  deleteAdmission,
  createGpaRecord,
  getGpaRecords,
  deleteGpaRecord,
} = require('../controllers/academicController');
const { protect } = require('../middleware/auth');

router.put('/dream-goal', protect, updateDreamGoal);
router.get('/exam-progress', protect, getExamProgress);

router.post('/admissions', protect, createAdmission);
router.get('/admissions', protect, getAdmissions);
router.put('/admissions/:id', protect, updateAdmission);
router.delete('/admissions/:id', protect, deleteAdmission);

router.post('/gpa', protect, createGpaRecord);
router.get('/gpa', protect, getGpaRecords);
router.delete('/gpa/:id', protect, deleteGpaRecord);

module.exports = router;
