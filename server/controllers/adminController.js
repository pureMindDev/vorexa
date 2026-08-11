const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Course = require('../models/Course');
const Post = require('../models/Post');
const Report = require('../models/Report');
const SupportTicket = require('../models/SupportTicket');
const CBTAttempt = require('../models/CBTAttempt');
const { notify } = require('../services/notificationService');

// ===================== DASHBOARD =====================

// @desc    Key platform metrics for the admin dashboard
// @route   GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalStudents,
      totalTutors,
      newUsersThisWeek,
      pendingTutorVerifications,
      totalCourses,
      cbtAttemptsToday,
      pendingReports,
      openTickets,
      revenueAgg,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'tutor' }),
      User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      TutorProfile.countDocuments({ isVerified: false }),
      Course.countDocuments({}),
      CBTAttempt.countDocuments({ createdAt: { $gte: startOfToday } }),
      Report.countDocuments({ status: 'pending' }),
      SupportTicket.countDocuments({ status: { $ne: 'resolved' } }),
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalTutors,
      newUsersThisWeek,
      pendingTutorVerifications,
      totalCourses,
      cbtAttemptsToday,
      pendingReports,
      openTickets,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};

// ===================== USER MANAGEMENT =====================

// @desc    List/search/filter users
// @route   GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email role status isVerified xp createdAt')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend, ban, or reactivate a user
// @route   PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't change your own account status" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select(
      'name email role status'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (status !== 'active') {
      await notify({
        userId: user._id,
        type: 'system',
        title: status === 'banned' ? 'Your account has been banned' : 'Your account has been suspended',
        message: 'Contact support if you believe this was a mistake.',
        link: '/settings',
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// @desc    Promote/demote a user's role (student <-> admin). Tutor role changes go through tutor registration.
// @route   PUT /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role can only be set to student or admin here' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't change your own role" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role status');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// ===================== TUTOR VERIFICATION =====================

// @desc    List tutor profiles pending verification
// @route   GET /api/admin/tutors/pending
const getPendingTutors = async (req, res, next) => {
  try {
    const tutors = await TutorProfile.find({ isVerified: false })
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: -1 });
    res.json({ tutors });
  } catch (error) {
    next(error);
  }
};

// @desc    List all tutor profiles (for the general tutor management table)
// @route   GET /api/admin/tutors
const getAllTutors = async (req, res, next) => {
  try {
    const tutors = await TutorProfile.find({})
      .populate('userId', 'name email status')
      .sort({ createdAt: -1 });
    res.json({ tutors });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or unverify a tutor
// @route   PUT /api/admin/tutors/:id/verify
const setTutorVerification = async (req, res, next) => {
  try {
    const { verified } = req.body;
    const tutor = await TutorProfile.findByIdAndUpdate(
      req.params.id,
      { isVerified: !!verified },
      { new: true }
    ).populate('userId', 'name email');

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor profile not found' });
    }

    await notify({
      userId: tutor.userId._id,
      type: 'system',
      title: verified ? "You're verified! 🎉" : 'Your tutor verification was revoked',
      message: verified
        ? 'Your tutor profile now shows a verified badge to students.'
        : 'Please contact support for details.',
      link: '/tutor/profile',
    });

    res.json({ tutor });
  } catch (error) {
    next(error);
  }
};

// ===================== PAYMENTS =====================

// @desc    List payments with revenue summary
// @route   GET /api/admin/payments
const getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('studentId', 'name email')
        .populate('tutorId', 'name email')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Payment.countDocuments(query),
    ]);

    res.json({ payments, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    next(error);
  }
};

// ===================== CONTENT MODERATION =====================

// @desc    List content reports
// @route   GET /api/admin/reports
const getReports = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const reports = await Report.find({ status })
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 });

    // Attach a lightweight snapshot of the reported post so admins don't need a second lookup.
    const postIds = reports.filter((r) => r.targetType === 'post').map((r) => r.targetId);
    const posts = await Post.find({ _id: { $in: postIds } }).populate('userId', 'name');
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));

    const enriched = reports.map((r) => ({
      ...r.toObject(),
      targetSnapshot:
        r.targetType === 'post'
          ? {
              content: postMap.get(r.targetId.toString())?.content || '(post deleted)',
              authorName: postMap.get(r.targetId.toString())?.userId?.name || 'Unknown',
            }
          : null,
    }));

    res.json({ reports: enriched });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve or dismiss a report
// @route   PUT /api/admin/reports/:id
const resolveReport = async (req, res, next) => {
  try {
    const { status, resolutionNote = '' } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be resolved or dismissed' });
    }

    const report = await Report.findByIdAndUpdate(req.params.id, { status, resolutionNote }, { new: true });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a reported post
// @route   DELETE /api/admin/posts/:id
const removePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    // Any pending reports against this post are now moot.
    await Report.updateMany(
      { targetType: 'post', targetId: post._id, status: 'pending' },
      { status: 'resolved', resolutionNote: 'Post removed by admin' }
    );
    res.json({ message: 'Post removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish/unpublish a course
// @route   PUT /api/admin/courses/:id/publish
const setCoursePublished = async (req, res, next) => {
  try {
    const { isPublished } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { isPublished: !!isPublished }, { new: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ course });
  } catch (error) {
    next(error);
  }
};

// ===================== SUPPORT TICKETS =====================

// @desc    List support tickets
// @route   GET /api/admin/support-tickets
const getSupportTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const tickets = await SupportTicket.find(query).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to and/or update the status of a support ticket
// @route   PUT /api/admin/support-tickets/:id
const respondToTicket = async (req, res, next) => {
  try {
    const { adminReply, status } = req.body;
    const update = {};
    if (adminReply !== undefined) update.adminReply = adminReply;
    if (status) {
      if (!['open', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      update.status = status;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true }).populate(
      'userId',
      'name email'
    );
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (adminReply) {
      await notify({
        userId: ticket.userId._id,
        type: 'system',
        title: `Support replied: ${ticket.subject}`,
        message: adminReply.slice(0, 100),
        link: '/settings?tab=Support',
      });
    }

    res.json({ ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getPendingTutors,
  getAllTutors,
  setTutorVerification,
  getPayments,
  getReports,
  resolveReport,
  removePost,
  setCoursePublished,
  getSupportTickets,
  respondToTicket,
};
