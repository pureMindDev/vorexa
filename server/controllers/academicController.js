const User = require('../models/User');
const CBTAttempt = require('../models/CBTAttempt');
const AdmissionApplication = require('../models/AdmissionApplication');
const GpaRecord = require('../models/GpaRecord');

// @desc    Update dream university/course
// @route   PUT /api/academic/dream-goal
const updateDreamGoal = async (req, res, next) => {
  try {
    const { dreamUniversity, dreamCourse } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { dreamUniversity: dreamUniversity || '', dreamCourse: dreamCourse || '' },
      { new: true }
    );
    res.json({ dreamUniversity: user.dreamUniversity, dreamCourse: user.dreamCourse });
  } catch (error) {
    next(error);
  }
};

// @desc    Get real exam readiness per exam type (JAMB/WAEC/NECO/Post-UTME), computed from actual CBT attempts
// @route   GET /api/academic/exam-progress
const getExamProgress = async (req, res, next) => {
  try {
    const attempts = await CBTAttempt.find({ userId: req.user._id, submittedAt: { $ne: null } })
      .select('examType score');

    const byType = {};
    attempts.forEach((a) => {
      if (!byType[a.examType]) byType[a.examType] = { total: 0, count: 0 };
      byType[a.examType].total += a.score;
      byType[a.examType].count += 1;
    });

    const progress = Object.entries(byType).map(([examType, stats]) => ({
      examType,
      averageScore: Math.round(stats.total / stats.count),
      attemptsCount: stats.count,
    }));

    res.json({ progress });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a university admission application
// @route   POST /api/academic/admissions
const createAdmission = async (req, res, next) => {
  try {
    const { universityName, course, status, notes } = req.body;
    if (!universityName?.trim() || !course?.trim()) {
      return res.status(400).json({ message: 'University name and course are required' });
    }

    const admission = await AdmissionApplication.create({
      userId: req.user._id,
      universityName: universityName.trim(),
      course: course.trim(),
      status: status || 'pending',
      notes: notes || '',
    });

    res.status(201).json({ admission });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admission applications
// @route   GET /api/academic/admissions
const getAdmissions = async (req, res, next) => {
  try {
    const admissions = await AdmissionApplication.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ admissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an admission's status
// @route   PUT /api/academic/admissions/:id
const updateAdmission = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const admission = await AdmissionApplication.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...(status && { status }), ...(notes !== undefined && { notes }) },
      { new: true }
    );
    if (!admission) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ admission });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an admission application
// @route   DELETE /api/academic/admissions/:id
const deleteAdmission = async (req, res, next) => {
  try {
    const admission = await AdmissionApplication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!admission) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a GPA record
// @route   POST /api/academic/gpa
const createGpaRecord = async (req, res, next) => {
  try {
    const { semesterLabel, gpa } = req.body;
    if (!semesterLabel?.trim() || gpa === undefined) {
      return res.status(400).json({ message: 'Semester label and GPA are required' });
    }
    if (gpa < 0 || gpa > 5) {
      return res.status(400).json({ message: 'GPA must be between 0 and 5' });
    }

    const record = await GpaRecord.create({
      userId: req.user._id,
      semesterLabel: semesterLabel.trim(),
      gpa,
    });

    res.status(201).json({ record });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all GPA records
// @route   GET /api/academic/gpa
const getGpaRecords = async (req, res, next) => {
  try {
    const records = await GpaRecord.find({ userId: req.user._id }).sort({ createdAt: 1 });
    const cgpa = records.length > 0
      ? Math.round((records.reduce((sum, r) => sum + r.gpa, 0) / records.length) * 100) / 100
      : null;
    res.json({ records, cgpa });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a GPA record
// @route   DELETE /api/academic/gpa/:id
const deleteGpaRecord = async (req, res, next) => {
  try {
    const record = await GpaRecord.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json({ message: 'Record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateDreamGoal,
  getExamProgress,
  createAdmission,
  getAdmissions,
  updateAdmission,
  deleteAdmission,
  createGpaRecord,
  getGpaRecords,
  deleteGpaRecord,
};
