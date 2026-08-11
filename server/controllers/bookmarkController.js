const Bookmark = require('../models/Bookmark');

// @desc    Toggle a bookmark on a course or a specific lesson (on if missing, off if present)
// @route   POST /api/bookmarks/toggle
const toggleBookmark = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const existing = await Bookmark.findOne({
      userId: req.user._id,
      courseId,
      lessonId: lessonId || null,
    });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      return res.json({ bookmarked: false });
    }

    await Bookmark.create({ userId: req.user._id, courseId, lessonId: lessonId || null });
    res.json({ bookmarked: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in user's bookmarked courses/lessons
// @route   GET /api/bookmarks
const getMyBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('courseId', 'title subject')
      .populate('lessonId', 'title durationMinutes');

    res.json({
      bookmarks: bookmarks
        .filter((b) => b.courseId) // guard against orphaned bookmarks if a course was deleted
        .map((b) => ({
          id: b._id,
          courseId: b.courseId._id,
          courseTitle: b.courseId.title,
          subject: b.courseId.subject,
          lessonId: b.lessonId?._id || null,
          lessonTitle: b.lessonId?.title || null,
          createdAt: b.createdAt,
        })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleBookmark, getMyBookmarks };
