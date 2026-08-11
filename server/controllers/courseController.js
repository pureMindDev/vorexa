const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const { recordActivity, XP_REWARDS, checkAndAwardBadges } = require('../services/gamificationService');
const { parseLimit, cursorFilter, paginate } = require('../utils/pagination');

// @desc    List published courses, optionally filtered by the user's subjects
// @route   GET /api/courses
const getCourses = async (req, res, next) => {
  try {
    const filter = { isPublished: true };

    // If the user has onboarded, prioritize their subjects/student type by filtering when possible
    if (req.query.subject) {
      filter.subject = req.query.subject;
    }
    if (req.query.search) {
      const term = String(req.query.search).trim().slice(0, 80);
      filter.title = { $regex: term, $options: 'i' };
    }

    const limit = parseLimit(req.query.limit, 12);
    const paged = await paginate(Course.find({ ...filter, ...cursorFilter(req.query.cursor) }), { limit });
    const courses = paged.docs;

    // Attach progress % per course for the logged-in user.
    // Both lookups are aggregations over just this page's ids, so cost stays flat as the
    // catalogue grows instead of scaling with the total number of courses.
    const courseIds = courses.map((c) => c._id);

    const lessonCounts = await Lesson.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);
    const lessonCountByCourse = {};
    lessonCounts.forEach((row) => {
      lessonCountByCourse[row._id.toString()] = row.count;
    });

    const progressRecords = await Progress.find({
      userId: req.user._id,
      courseId: { $in: courseIds },
      completed: true,
    }).select('courseId');
    const completedCountByCourse = {};
    progressRecords.forEach((p) => {
      const key = p.courseId.toString();
      completedCountByCourse[key] = (completedCountByCourse[key] || 0) + 1;
    });

    const withProgress = courses.map((course) => {
      const total = lessonCountByCourse[course._id.toString()] || 0;
      const done = completedCountByCourse[course._id.toString()] || 0;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ...course.toObject(), lessonCount: total, progress };
    });

    res.json({ courses: withProgress, nextCursor: paged.nextCursor, hasMore: paged.hasMore });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single course with its lessons
// @route   GET /api/courses/:id
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });

    const progressRecords = await Progress.find({
      userId: req.user._id,
      courseId: course._id,
    });
    const completedLessonIds = new Set(
      progressRecords.filter((p) => p.completed).map((p) => p.lessonId.toString())
    );

    const lessonsWithProgress = lessons.map((l) => ({
      ...l.toObject(),
      completed: completedLessonIds.has(l._id.toString()),
    }));

    const progress = lessons.length > 0
      ? Math.round((completedLessonIds.size / lessons.length) * 100)
      : 0;

    const completedAt = progress === 100
      ? progressRecords
          .filter((p) => p.completed)
          .reduce((latest, p) => (p.completedAt > latest ? p.completedAt : latest), progressRecords[0]?.completedAt)
      : null;

    res.json({ course, lessons: lessonsWithProgress, progress, completedAt });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a lesson complete for the logged-in user
// @route   POST /api/courses/:courseId/lessons/:lessonId/complete
const completeLesson = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;

    const lesson = await Lesson.findOne({ _id: lessonId, courseId });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found in this course' });
    }

    const existing = await Progress.findOne({ userId: req.user._id, lessonId });

    if (existing?.completed) {
      return res.json({ message: 'Lesson already marked complete', alreadyCompleted: true });
    }

    await Progress.findOneAndUpdate(
      { userId: req.user._id, lessonId },
      { userId: req.user._id, courseId, lessonId, completed: true, completedAt: new Date() },
      { upsert: true, new: true }
    );

    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.LESSON_COMPLETE);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({
      message: 'Lesson marked complete',
      xpEarned: XP_REWARDS.LESSON_COMPLETE,
      xp: updatedUser.xp,
      streakCount: updatedUser.streakCount,
      newBadges,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCourses, getCourseById, completeLesson };
