const User = require('../models/User');
const TutorialCentre = require('../models/TutorialCentre');
const CentreMember = require('../models/CentreMember');
const CustomExam = require('../models/CustomExam');
const CustomExamAttempt = require('../models/CustomExamAttempt');
const Payment = require('../models/Payment');
const LiveClassAttendance = require('../models/LiveClassAttendance');
const LiveClass = require('../models/LiveClass');
const { notify } = require('../services/notificationService');

const requireCentreOwner = async (userId) => {
  const centre = await TutorialCentre.findOne({ ownerId: userId });
  return centre;
};

// ===================== CENTRE PROFILE =====================

const createCentre = async (req, res, next) => {
  try {
    const existing = await TutorialCentre.findOne({ ownerId: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already have a centre profile' });

    const { name, description, address, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Centre name is required' });

    const centre = await TutorialCentre.create({
      ownerId: req.user._id,
      name: name.trim(),
      description: description?.trim() || '',
      address: address?.trim() || '',
      phone: phone?.trim() || '',
    });

    res.status(201).json({ centre });
  } catch (error) {
    next(error);
  }
};

const getMyCentre = async (req, res, next) => {
  try {
    const centre = await requireCentreOwner(req.user._id);
    if (!centre) return res.status(404).json({ message: 'No centre profile yet' });
    res.json({ centre });
  } catch (error) {
    next(error);
  }
};

const updateCentre = async (req, res, next) => {
  try {
    const centre = await requireCentreOwner(req.user._id);
    if (!centre) return res.status(404).json({ message: 'No centre profile yet' });

    const { name, description, address, phone } = req.body;
    if (name !== undefined) centre.name = name.trim();
    if (description !== undefined) centre.description = description.trim();
    if (address !== undefined) centre.address = address.trim();
    if (phone !== undefined) centre.phone = phone.trim();
    await centre.save();

    res.json({ centre });
  } catch (error) {
    next(error);
  }
};

// ===================== MEMBER MANAGEMENT =====================

const inviteMember = async (req, res, next) => {
  try {
    const centre = await requireCentreOwner(req.user._id);
    if (!centre) return res.status(404).json({ message: 'Create your centre profile first' });

    const { email, memberRole } = req.body;
    if (!email?.trim() || !['tutor', 'student'].includes(memberRole)) {
      return res.status(400).json({ message: 'A valid email and member role (tutor or student) are required' });
    }

    const invitee = await User.findOne({ email: email.toLowerCase().trim(), role: memberRole });
    if (!invitee) {
      return res.status(404).json({ message: `No ${memberRole} account found with that email` });
    }

    const existing = await CentreMember.findOne({ centreId: centre._id, userId: invitee._id });
    if (existing && existing.status !== 'declined' && existing.status !== 'removed') {
      return res.status(400).json({ message: `Already ${existing.status} for this centre` });
    }

    const member = existing
      ? await CentreMember.findByIdAndUpdate(existing._id, { status: 'pending', memberRole }, { new: true })
      : await CentreMember.create({ centreId: centre._id, userId: invitee._id, memberRole });

    await notify({
      userId: invitee._id,
      type: 'system',
      title: `Invitation from ${centre.name}`,
      message: `${centre.name} invited you to join as a ${memberRole}.`,
      link: '/settings?tab=Centres',
    });

    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const centre = await requireCentreOwner(req.user._id);
    if (!centre) return res.status(404).json({ message: 'No centre profile yet' });

    const { memberRole, status } = req.query;
    const query = { centreId: centre._id };
    if (memberRole) query.memberRole = memberRole;
    if (status) query.status = status;
    else query.status = { $ne: 'removed' };

    const members = await CentreMember.find(query).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ members });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const centre = await requireCentreOwner(req.user._id);
    if (!centre) return res.status(404).json({ message: 'No centre profile yet' });

    const member = await CentreMember.findOneAndUpdate(
      { _id: req.params.id, centreId: centre._id },
      { status: 'removed' },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: 'Member not found' });

    res.json({ message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

const getMyInvites = async (req, res, next) => {
  try {
    const invites = await CentreMember.find({ userId: req.user._id, status: { $in: ['pending', 'active'] } })
      .populate('centreId', 'name description')
      .sort({ createdAt: -1 });
    res.json({ invites });
  } catch (error) {
    next(error);
  }
};

const respondToInvite = async (req, res, next) => {
  try {
    const { action } = req.body;
    const invite = await CentreMember.findById(req.params.id).populate('centreId', 'name ownerId');
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your invite' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'This invite has already been handled' });
    }

    invite.status = action === 'accept' ? 'active' : 'declined';
    await invite.save();

    if (action === 'accept') {
      await notify({
        userId: invite.centreId.ownerId,
        type: 'system',
        title: 'Centre invite accepted',
        message: `${req.user.name} accepted your invitation to join ${invite.centreId.name}.`,
        link: '/centre/members',
      });
    }

    res.json({ invite });
  } catch (error) {
    next(error);
  }
};

const leaveCentre = async (req, res, next) => {
  try {
    const membership = await CentreMember.findById(req.params.id);
    if (!membership) return res.status(404).json({ message: 'Membership not found' });
    if (membership.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your membership' });
    }
    membership.status = 'removed';
    await membership.save();
    res.json({ message: 'Left the centre' });
  } catch (error) {
    next(error);
  }
};

// ===================== CUSTOM EXAMS =====================

const createExam = async (req, res, next) => {
  try {
    const { centreId, title, subject, durationMinutes, questions } = req.body;
    const centre = await TutorialCentre.findById(centreId);
    if (!centre) return res.status(404).json({ message: 'Centre not found' });

    const isOwner = centre.ownerId.toString() === req.user._id.toString();
    if (!isOwner) {
      const membership = await CentreMember.findOne({
        centreId,
        userId: req.user._id,
        memberRole: 'tutor',
        status: 'active',
      });
      if (!membership) return res.status(403).json({ message: 'Only the centre owner or an active tutor can create exams' });
    }

    if (!title?.trim() || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'A title and at least one question are required' });
    }
    const invalidQuestion = questions.find(
      (q) => !q.questionText?.trim() || !Array.isArray(q.options) || q.options.length !== 4 || q.correctAnswer == null
    );
    if (invalidQuestion) {
      return res.status(400).json({ message: 'Every question needs text, 4 options, and a correct answer' });
    }

    const exam = await CustomExam.create({
      centreId,
      createdBy: req.user._id,
      title: title.trim(),
      subject: subject?.trim() || '',
      durationMinutes: durationMinutes || 30,
      questions,
    });

    res.status(201).json({ exam });
  } catch (error) {
    next(error);
  }
};

const setExamPublished = async (req, res, next) => {
  try {
    const exam = await CustomExam.findById(req.params.id).populate('centreId', 'ownerId');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.centreId.ownerId.toString() !== req.user._id.toString() && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish this exam' });
    }
    exam.isPublished = !!req.body.isPublished;
    await exam.save();

    if (exam.isPublished) {
      const students = await CentreMember.find({ centreId: exam.centreId._id, memberRole: 'student', status: 'active' });
      await Promise.all(
        students.map((s) =>
          notify({
            userId: s.userId,
            type: 'system',
            title: `New exam: ${exam.title}`,
            message: 'A new custom exam is ready for you to take.',
            link: '/centre-exams',
          })
        )
      );
    }

    res.json({ exam });
  } catch (error) {
    next(error);
  }
};

const getExams = async (req, res, next) => {
  try {
    const { centreId } = req.query;
    if (!centreId) return res.status(400).json({ message: 'centreId is required' });

    const centre = await TutorialCentre.findById(centreId);
    if (!centre) return res.status(404).json({ message: 'Centre not found' });

    const membership = await CentreMember.findOne({ centreId, userId: req.user._id, status: 'active' });
    const isOwner = centre.ownerId.toString() === req.user._id.toString();
    if (!isOwner && !membership) return res.status(403).json({ message: 'Not a member of this centre' });

    const canSeeDrafts = isOwner || membership?.memberRole === 'tutor';
    const query = { centreId };
    if (!canSeeDrafts) query.isPublished = true;

    const exams = await CustomExam.find(query).select('-questions.correctAnswer -questions.explanation').sort({ createdAt: -1 });
    res.json({ exams });
  } catch (error) {
    next(error);
  }
};

const getExam = async (req, res, next) => {
  try {
    const exam = await CustomExam.findById(req.params.id).populate('centreId', 'ownerId name');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const isOwner = exam.centreId.ownerId.toString() === req.user._id.toString();
    const membership = await CentreMember.findOne({ centreId: exam.centreId._id, userId: req.user._id, status: 'active' });
    if (!isOwner && !membership) return res.status(403).json({ message: 'Not a member of this centre' });

    const canSeeAnswers = isOwner || membership?.memberRole === 'tutor';
    const examObj = exam.toObject();
    if (!canSeeAnswers) {
      examObj.questions = examObj.questions.map((q) => ({ questionText: q.questionText, options: q.options, _id: q._id }));
    }

    res.json({ exam: examObj, canSeeAnswers });
  } catch (error) {
    next(error);
  }
};

const submitExam = async (req, res, next) => {
  try {
    const exam = await CustomExam.findById(req.params.id);
    if (!exam || !exam.isPublished) return res.status(404).json({ message: 'Exam not available' });

    const membership = await CentreMember.findOne({
      centreId: exam.centreId,
      userId: req.user._id,
      memberRole: 'student',
      status: 'active',
    });
    if (!membership) return res.status(403).json({ message: 'Not an active student of this centre' });

    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ message: 'Answers array is required' });

    let correctCount = 0;
    answers.forEach((a) => {
      const question = exam.questions[a.questionIndex];
      if (question && question.correctAnswer === a.selectedOption) correctCount += 1;
    });
    const score = exam.questions.length ? Math.round((correctCount / exam.questions.length) * 100) : 0;

    const attempt = await CustomExamAttempt.create({
      examId: exam._id,
      studentId: req.user._id,
      answers,
      score,
      submittedAt: new Date(),
    });

    res.status(201).json({ attempt });
  } catch (error) {
    next(error);
  }
};

const getExamResults = async (req, res, next) => {
  try {
    const exam = await CustomExam.findById(req.params.id).populate('centreId', 'ownerId');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const isOwner = exam.centreId.ownerId.toString() === req.user._id.toString();
    if (!isOwner && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view results' });
    }

    const attempts = await CustomExamAttempt.find({ examId: exam._id })
      .populate('studentId', 'name email')
      .sort({ score: -1 });

    res.json({ attempts });
  } catch (error) {
    next(error);
  }
};

// ===================== REPORTING =====================

const getPerformanceReport = async (req, res, next) => {
  try {
    const centre = await requireCentreOwner(req.user._id);
    if (!centre) return res.status(404).json({ message: 'No centre profile yet' });

    const students = await CentreMember.find({ centreId: centre._id, memberRole: 'student', status: 'active' });
    const tutors = await CentreMember.find({ centreId: centre._id, memberRole: 'tutor', status: 'active' });
    const studentIds = students.map((s) => s.userId);

    const [examAttempts, centreClasses] = await Promise.all([
      CustomExamAttempt.find({ studentId: { $in: studentIds } }).populate({
        path: 'examId',
        match: { centreId: centre._id },
        select: 'centreId title',
      }),
      LiveClass.find({ centreId: centre._id }).select('_id'),
    ]);

    const relevantAttempts = examAttempts.filter((a) => a.examId);
    const avgScore = relevantAttempts.length
      ? Math.round(relevantAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / relevantAttempts.length)
      : null;

    const attendanceRecords = await LiveClassAttendance.find({
      liveClassId: { $in: centreClasses.map((c) => c._id) },
      userId: { $in: studentIds },
    });

    res.json({
      totalStudents: students.length,
      totalTutors: tutors.length,
      totalClasses: centreClasses.length,
      totalExamAttempts: relevantAttempts.length,
      averageExamScore: avgScore,
      totalAttendanceRecords: attendanceRecords.length,
    });
  } catch (error) {
    next(error);
  }
};

const getCentrePayments = async (req, res, next) => {
  try {
    const centre = await requireCentreOwner(req.user._id);
    if (!centre) return res.status(404).json({ message: 'No centre profile yet' });

    const students = await CentreMember.find({ centreId: centre._id, memberRole: 'student', status: 'active' });
    const studentIds = students.map((s) => s.userId);

    const payments = await Payment.find({ studentId: { $in: studentIds } })
      .populate('studentId', 'name')
      .populate('tutorId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    const totalCollected = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);

    res.json({ totalCollected, payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
