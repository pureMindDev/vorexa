const Question = require('../models/Question');
const CBTAttempt = require('../models/CBTAttempt');
const { recordActivity, XP_REWARDS, checkAndAwardBadges } = require('../services/gamificationService');
const { parseLimit, cursorFilter, paginate } = require('../utils/pagination');

const DEFAULT_QUESTIONS_PER_SUBJECT = 10;
const MAX_SUBJECTS = 4;
const DEFAULT_SECONDS_PER_QUESTION = 60;
// A little slack so a slow network round-trip on the final submit isn't punished as cheating.
const SUBMIT_GRACE_SECONDS = 15;

// @desc    List subjects available for a given exam type with question counts
// @route   GET /api/cbt/subjects?examType=JAMB
const getSubjects = async (req, res, next) => {
  try {
    const examType = req.query.examType || 'JAMB';

    const results = await Question.aggregate([
      { $match: { examType } },
      { $group: { _id: '$subject', questionCount: { $sum: 1 } } },
      { $project: { subject: '$_id', questionCount: 1, _id: 0 } },
      { $sort: { subject: 1 } },
    ]);

    res.json({ examType, subjects: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a new CBT attempt across 1-4 subjects — pulls a random set of questions per subject
// @route   POST /api/cbt/start
const startExam = async (req, res, next) => {
  try {
    const { examType, subjects, questionsPerSubject, durationMinutes } = req.body;

    if (!examType) {
      return res.status(400).json({ message: 'examType is required' });
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Select at least 1 subject' });
    }
    if (subjects.length > MAX_SUBJECTS) {
      return res.status(400).json({ message: `You can select a maximum of ${MAX_SUBJECTS} subjects` });
    }

    const uniqueSubjects = [...new Set(subjects)];
    const perSubjectCount = Math.min(
      Math.max(parseInt(questionsPerSubject, 10) || DEFAULT_QUESTIONS_PER_SUBJECT, 1),
      50
    );

    let allQuestions = [];
    const missingSubjects = [];

    for (const subject of uniqueSubjects) {
      const questions = await Question.aggregate([
        { $match: { examType, subject } },
        { $sample: { size: perSubjectCount } },
      ]);

      if (questions.length === 0) {
        missingSubjects.push(subject);
        continue;
      }

      allQuestions = allQuestions.concat(questions);
    }

    if (allQuestions.length === 0) {
      return res.status(404).json({
        message: `No questions found for ${uniqueSubjects.join(', ')} under ${examType} yet`,
      });
    }

    // Shuffle the combined question set so subjects are interleaved, not grouped
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // The clock is owned by the server. The client renders a countdown from `expiresAt`,
    // but the deadline that actually counts is the one stored here.
    const requestedMinutes = parseInt(durationMinutes, 10);
    const durationSeconds =
      Number.isFinite(requestedMinutes) && requestedMinutes > 0
        ? Math.min(requestedMinutes, 240) * 60
        : allQuestions.length * DEFAULT_SECONDS_PER_QUESTION;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    const attempt = await CBTAttempt.create({
      userId: req.user._id,
      examType,
      subjects: uniqueSubjects,
      questions: allQuestions.map((q) => q._id),
      answers: allQuestions.map((q) => ({ questionId: q._id, selectedOption: null, subject: q.subject })),
      totalQuestions: allQuestions.length,
      durationSeconds,
      startedAt,
      expiresAt,
    });

    const sanitized = allQuestions.map((q) => ({
      id: q._id,
      subject: q.subject,
      questionText: q.questionText,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.status(201).json({
      attemptId: attempt._id,
      examType,
      subjects: uniqueSubjects,
      questions: sanitized,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      durationSeconds,
      warning: missingSubjects.length > 0
        ? `No questions available yet for: ${missingSubjects.join(', ')}`
        : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resume an in-progress attempt (refresh, tab crash, device switch)
// @route   GET /api/cbt/:attemptId/resume
const resumeAttempt = async (req, res, next) => {
  try {
    const attempt = await CBTAttempt.findOne({ _id: req.params.attemptId, userId: req.user._id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.submittedAt) return res.status(400).json({ message: 'This attempt is already submitted' });

    const questions = await Question.find({ _id: { $in: attempt.questions } }).select(
      'subject questionText options difficulty'
    );
    const byId = new Map(questions.map((q) => [q._id.toString(), q]));

    res.json({
      attemptId: attempt._id,
      examType: attempt.examType,
      subjects: attempt.subjects,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      durationSeconds: attempt.durationSeconds,
      savedAnswers: attempt.answers
        .filter((a) => a.selectedOption !== null && a.selectedOption !== undefined)
        .map((a) => ({ questionId: a.questionId, selectedOption: a.selectedOption })),
      questions: attempt.questions
        .map((id) => byId.get(id.toString()))
        .filter(Boolean)
        .map((q) => ({
          id: q._id,
          subject: q.subject,
          questionText: q.questionText,
          options: q.options,
          difficulty: q.difficulty,
        })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Autosave answers mid-exam so nothing is lost on a refresh or dropped connection
// @route   PATCH /api/cbt/:attemptId/answers
const saveAnswers = async (req, res, next) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedOption, timeSpentSeconds }]
    if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers array is required' });

    const attempt = await CBTAttempt.findOne({ _id: req.params.attemptId, userId: req.user._id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.submittedAt) return res.status(400).json({ message: 'This attempt is already submitted' });

    const incoming = new Map(answers.map((a) => [String(a.questionId), a]));
    attempt.answers = attempt.answers.map((a) => {
      const update = incoming.get(a.questionId.toString());
      if (!update) return a;
      a.selectedOption = update.selectedOption ?? null;
      if (Number.isFinite(update.timeSpentSeconds)) a.timeSpentSeconds = update.timeSpentSeconds;
      return a;
    });
    await attempt.save();

    res.json({ saved: true, secondsRemaining: secondsRemaining(attempt) });
  } catch (error) {
    next(error);
  }
};

const secondsRemaining = (attempt) => {
  if (!attempt.expiresAt) return null;
  return Math.max(0, Math.round((attempt.expiresAt.getTime() - Date.now()) / 1000));
};

// @desc    Submit answers for a CBT attempt and get scored
// @route   POST /api/cbt/:attemptId/submit
const submitExam = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body; // [{ questionId, selectedOption, timeSpentSeconds }]

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'answers array is required' });
    }

    const attempt = await CBTAttempt.findOne({ _id: attemptId, userId: req.user._id });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    if (attempt.submittedAt) {
      return res.status(400).json({ message: 'This attempt has already been submitted' });
    }

    // Server-enforced deadline. Answers that arrive after it are still graded (we don't want
    // to void a student's work on a laggy connection) but the attempt is flagged auto-submitted.
    const expired =
      attempt.expiresAt && Date.now() > attempt.expiresAt.getTime() + SUBMIT_GRACE_SECONDS * 1000;

    const questions = await Question.find({ _id: { $in: attempt.questions } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
    const incoming = new Map(answers.map((a) => [String(a.questionId), a]));

    let correctCount = 0;
    const breakdown = new Map(); // subject -> { correct, total }

    const gradedAnswers = attempt.questions.map((qId) => {
      const key = qId.toString();
      const submitted = incoming.get(key);
      const question = questionMap.get(key);
      const selectedOption = submitted ? submitted.selectedOption ?? null : null;
      const isCorrect = Boolean(question) && selectedOption === question.correctAnswer;
      if (isCorrect) correctCount += 1;

      const subject = question?.subject || 'Unknown';
      if (!breakdown.has(subject)) breakdown.set(subject, { correct: 0, total: 0 });
      const row = breakdown.get(subject);
      row.total += 1;
      if (isCorrect) row.correct += 1;

      return {
        questionId: qId,
        selectedOption,
        isCorrect,
        subject,
        timeSpentSeconds: Number.isFinite(submitted?.timeSpentSeconds) ? submitted.timeSpentSeconds : null,
      };
    });

    const score = Math.round((correctCount / attempt.totalQuestions) * 100);
    const timeTakenSeconds = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

    attempt.answers = gradedAnswers;
    attempt.subjectBreakdown = [...breakdown.entries()].map(([subject, row]) => ({
      subject,
      correct: row.correct,
      total: row.total,
    }));
    attempt.score = score;
    attempt.timeTakenSeconds = timeTakenSeconds;
    attempt.submittedAt = new Date();
    attempt.autoSubmitted = Boolean(expired);
    await attempt.save();

    const updatedUser = await recordActivity(req.user._id, XP_REWARDS.CBT_SUBMIT);
    const newBadges = await checkAndAwardBadges(req.user._id);

    res.json({
      message: expired ? 'Time is up — your exam was auto-submitted' : 'Exam submitted',
      autoSubmitted: Boolean(expired),
      score,
      correctCount,
      totalQuestions: attempt.totalQuestions,
      timeTakenSeconds,
      subjectBreakdown: attempt.subjectBreakdown.map((row) => ({
        subject: row.subject,
        correct: row.correct,
        total: row.total,
        accuracy: row.total ? Math.round((row.correct / row.total) * 100) : 0,
      })),
      xpEarned: XP_REWARDS.CBT_SUBMIT,
      xp: updatedUser.xp,
      newBadges,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get answer review for a submitted attempt
// @route   GET /api/cbt/:attemptId/review
const getAttemptReview = async (req, res, next) => {
  try {
    const attempt = await CBTAttempt.findOne({ _id: req.params.attemptId, userId: req.user._id });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    if (!attempt.submittedAt) {
      return res.status(400).json({ message: 'This attempt has not been submitted yet' });
    }

    const questions = await Question.find({ _id: { $in: attempt.questions } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const review = attempt.answers
      .map((a) => {
        const q = questionMap.get(a.questionId.toString());
        if (!q) return null;
        return {
          subject: q.subject,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          selectedOption: a.selectedOption,
          explanation: q.explanation,
          timeSpentSeconds: a.timeSpentSeconds,
          isCorrect: a.selectedOption === q.correctAnswer,
        };
      })
      .filter(Boolean);

    res.json({
      subjects: attempt.subjects,
      examType: attempt.examType,
      score: attempt.score,
      autoSubmitted: attempt.autoSubmitted,
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in user's past CBT results (cursor paginated)
// @route   GET /api/cbt/results?cursor=&limit=
const getResults = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 15);
    const paged = await paginate(
      CBTAttempt.find({
        userId: req.user._id,
        submittedAt: { $ne: null },
        ...cursorFilter(req.query.cursor, 'submittedAt'),
      }).select('subjects examType score submittedAt totalQuestions timeTakenSeconds autoSubmitted subjectBreakdown'),
      { limit, field: 'submittedAt' }
    );

    res.json({ results: paged.docs, nextCursor: paged.nextCursor, hasMore: paged.hasMore });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggregate performance analytics across every submitted attempt
// @route   GET /api/cbt/analytics?examType=
// Everything here is computed in Mongo rather than in Node so it stays cheap as history grows.
const getAnalytics = async (req, res, next) => {
  try {
    const match = { userId: req.user._id, submittedAt: { $ne: null } };
    if (req.query.examType) match.examType = req.query.examType;

    const [summaryRow] = await CBTAttempt.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 },
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' },
          worstScore: { $min: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalTimeSeconds: { $sum: '$timeTakenSeconds' },
        },
      },
    ]);

    const bySubject = await CBTAttempt.aggregate([
      { $match: match },
      { $unwind: '$subjectBreakdown' },
      {
        $group: {
          _id: '$subjectBreakdown.subject',
          correct: { $sum: '$subjectBreakdown.correct' },
          total: { $sum: '$subjectBreakdown.total' },
          sittings: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          subject: '$_id',
          correct: 1,
          total: 1,
          sittings: 1,
          accuracy: {
            $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$correct', '$total'] }, 100] }, 0] }, 0],
          },
        },
      },
      { $sort: { accuracy: -1 } },
    ]);

    // Score trend, oldest -> newest, capped at the last 15 sittings so the chart stays readable.
    const trendDesc = await CBTAttempt.find(match)
      .sort({ submittedAt: -1 })
      .limit(15)
      .select('score submittedAt examType subjects');
    const trend = trendDesc.reverse().map((a) => ({
      score: a.score,
      submittedAt: a.submittedAt,
      examType: a.examType,
      subjects: a.subjects,
    }));

    const pacingRows = await CBTAttempt.aggregate([
      { $match: match },
      { $unwind: '$answers' },
      { $match: { 'answers.timeSpentSeconds': { $ne: null } } },
      {
        $group: {
          _id: '$answers.subject',
          avgSeconds: { $avg: '$answers.timeSpentSeconds' },
          answered: { $sum: 1 },
        },
      },
      { $project: { _id: 0, subject: '$_id', avgSeconds: { $round: ['$avgSeconds', 1] }, answered: 1 } },
      { $sort: { avgSeconds: -1 } },
    ]);

    const summary = summaryRow
      ? {
          attempts: summaryRow.attempts,
          averageScore: Math.round(summaryRow.averageScore || 0),
          bestScore: summaryRow.bestScore || 0,
          worstScore: summaryRow.worstScore || 0,
          questionsAnswered: summaryRow.totalQuestions || 0,
          totalTimeSeconds: summaryRow.totalTimeSeconds || 0,
        }
      : { attempts: 0, averageScore: 0, bestScore: 0, worstScore: 0, questionsAnswered: 0, totalTimeSeconds: 0 };

    res.json({
      summary,
      bySubject,
      trend,
      pacing: pacingRows,
      strongest: bySubject[0] || null,
      weakest: bySubject.length ? bySubject[bySubject.length - 1] : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  startExam,
  resumeAttempt,
  saveAnswers,
  submitExam,
  getAttemptReview,
  getResults,
  getAnalytics,
};
