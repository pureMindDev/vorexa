const User = require('../models/User');
const ParentChildLink = require('../models/ParentChildLink');
const Progress = require('../models/Progress');
const CBTAttempt = require('../models/CBTAttempt');
const Payment = require('../models/Payment');
const LiveClassAttendance = require('../models/LiveClassAttendance');
const LiveClass = require('../models/LiveClass');
const { notify } = require('../services/notificationService');

const requireApprovedLink = async (parentId, studentId) => {
  const link = await ParentChildLink.findOne({ parentId, studentId, status: 'approved' });
  return link;
};

// ===================== LINKING =====================

// @desc    Parent requests to link with a student account by email
// @route   POST /api/parent/link-requests
const sendLinkRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: "The student's email is required" });

    const student = await User.findOne({ email: email.toLowerCase().trim(), role: 'student' });
    if (!student) return res.status(404).json({ message: 'No student account found with that email' });

    // There's a unique index on (parentId, studentId), so a previously declined/revoked link
    // can't just be re-created — that would throw a duplicate-key error. Find any existing
    // link (of any status) and either block on it (still pending/approved) or reuse it by
    // resetting it back to pending, so a parent can always retry after a decline.
    const existing = await ParentChildLink.findOne({ parentId: req.user._id, studentId: student._id });

    let link;
    if (existing) {
      if (['pending', 'approved'].includes(existing.status)) {
        return res.status(400).json({ message: `A ${existing.status} link with this student already exists` });
      }
      existing.status = 'pending';
      await existing.save();
      link = existing;
    } else {
      link = await ParentChildLink.create({ parentId: req.user._id, studentId: student._id });
    }

    await notify({
      userId: student._id,
      type: 'system',
      title: 'Parent link request',
      message: `${req.user.name} wants to link as your parent/guardian to view your progress.`,
      link: '/settings?tab=Family',
    });

    res.status(201).json({ link });
  } catch (error) {
    next(error);
  }
};

// @desc    List the parent's link requests (pending + approved)
// @route   GET /api/parent/link-requests
const getMyLinkRequests = async (req, res, next) => {
  try {
    const links = await ParentChildLink.find({ parentId: req.user._id, status: { $ne: 'revoked' } })
      .populate('studentId', 'name email xp streakCount')
      .sort({ createdAt: -1 });
    res.json({ links });
  } catch (error) {
    next(error);
  }
};

// @desc    A student's incoming pending parent link requests
// @route   GET /api/parent/incoming-requests
const getIncomingRequests = async (req, res, next) => {
  try {
    const links = await ParentChildLink.find({ studentId: req.user._id, status: 'pending' })
      .populate('parentId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ links });
  } catch (error) {
    next(error);
  }
};

// @desc    Student approves/declines a parent link request
// @route   PUT /api/parent/link-requests/:id
const respondToLinkRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'decline'
    const link = await ParentChildLink.findById(req.params.id);
    if (!link) return res.status(404).json({ message: 'Request not found' });
    if (link.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your request to respond to' });
    }
    if (link.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been handled' });
    }

    link.status = action === 'approve' ? 'approved' : 'declined';
    await link.save();

    if (action === 'approve') {
      await notify({
        userId: link.parentId,
        type: 'system',
        title: 'Parent link approved',
        message: `${req.user.name} approved your link request. You can now view their progress.`,
        link: '/parent/dashboard',
      });
    }

    res.json({ link });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke an approved link (either the parent or the student can do this)
// @route   DELETE /api/parent/link-requests/:id
const revokeLink = async (req, res, next) => {
  try {
    const link = await ParentChildLink.findById(req.params.id);
    if (!link) return res.status(404).json({ message: 'Link not found' });

    const isParticipant = [link.parentId.toString(), link.studentId.toString()].includes(req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: 'Not your link' });

    link.status = 'revoked';
    await link.save();
    res.json({ message: 'Link revoked' });
  } catch (error) {
    next(error);
  }
};

// ===================== CHILD DATA (parent view) =====================

// @desc    List the parent's linked children with a quick summary
// @route   GET /api/parent/children
const getMyChildren = async (req, res, next) => {
  try {
    const links = await ParentChildLink.find({ parentId: req.user._id, status: 'approved' }).populate(
      'studentId',
      'name email xp streakCount createdAt'
    );

    res.json({
      children: links.map((l) => ({
        linkId: l._id,
        id: l.studentId._id,
        name: l.studentId.name,
        email: l.studentId.email,
        xp: l.studentId.xp,
        streakCount: l.studentId.streakCount,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    A child's academic progress — course completion, CBT performance, XP/streak
// @route   GET /api/parent/children/:studentId/progress
const getChildProgress = async (req, res, next) => {
  try {
    const link = await requireApprovedLink(req.user._id, req.params.studentId);
    if (!link) return res.status(403).json({ message: 'No approved link with this student' });

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [student, lessonsCompleted, cbtAttempts, cbtThisWeek] = await Promise.all([
      User.findById(req.params.studentId).select('name xp streakCount'),
      Progress.countDocuments({ userId: req.params.studentId, completed: true }),
      CBTAttempt.find({ userId: req.params.studentId }).sort({ createdAt: -1 }).limit(10),
      CBTAttempt.countDocuments({ userId: req.params.studentId, createdAt: { $gte: startOfWeek } }),
    ]);

    const scored = cbtAttempts.filter((a) => typeof a.score === 'number');
    const avgScore = scored.length ? scored.reduce((sum, a) => sum + a.score, 0) / scored.length : null;

    res.json({
      student: { name: student.name, xp: student.xp, streakCount: student.streakCount },
      lessonsCompleted,
      cbtThisWeek,
      averageCbtScore: avgScore,
      recentCbtAttempts: cbtAttempts.map((a) => ({
        id: a._id,
        examType: a.examType,
        subjects: a.subjects,
        score: a.score,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    A child's live-class attendance history
// @route   GET /api/parent/children/:studentId/attendance
const getChildAttendance = async (req, res, next) => {
  try {
    const link = await requireApprovedLink(req.user._id, req.params.studentId);
    if (!link) return res.status(403).json({ message: 'No approved link with this student' });

    const records = await LiveClassAttendance.find({ userId: req.params.studentId })
      .sort({ joinedAt: -1 })
      .limit(30)
      .populate({ path: 'liveClassId', select: 'title scheduledFor', model: LiveClass });

    res.json({
      attendance: records.map((r) => ({
        classTitle: r.liveClassId?.title || 'Live class',
        scheduledFor: r.liveClassId?.scheduledFor,
        joinedAt: r.joinedAt,
        leftAt: r.leftAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    A child's tutor bookings + payment history (for fee tracking)
// @route   GET /api/parent/children/:studentId/payments
const getChildPayments = async (req, res, next) => {
  try {
    const link = await requireApprovedLink(req.user._id, req.params.studentId);
    if (!link) return res.status(403).json({ message: 'No approved link with this student' });

    const payments = await Payment.find({ studentId: req.params.studentId })
      .populate('tutorId', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    const totalPaid = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);

    res.json({
      totalPaid,
      payments: payments.map((p) => ({
        id: p._id,
        amount: p.amount,
        status: p.status,
        tutorName: p.tutorId?.name,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendLinkRequest,
  getMyLinkRequests,
  getIncomingRequests,
  respondToLinkRequest,
  revokeLink,
  getMyChildren,
  getChildProgress,
  getChildAttendance,
  getChildPayments,
};
