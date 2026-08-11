const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, completeLesson } = require('../controllers/courseController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCourses);
router.get('/:id', protect, getCourseById);
router.post('/:courseId/lessons/:lessonId/complete', protect, completeLesson);

module.exports = router;
