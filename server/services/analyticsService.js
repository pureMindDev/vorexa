const Question = require('../models/Question');
const CBTAttempt = require('../models/CBTAttempt');

// Computes real per-subject accuracy from a user's submitted CBT attempts.
// Used by both the Achievements page (Subject Performance) and the AI Revision Planner
// (to prioritize weak subjects), so it lives in one place.
const computeSubjectAccuracy = async (userId) => {
  const attempts = await CBTAttempt.find({ userId, submittedAt: { $ne: null } });

  if (attempts.length === 0) {
    return { subjects: [], hasData: false };
  }

  const allQuestionIds = attempts.flatMap((a) => a.questions);
  const questions = await Question.find({ _id: { $in: allQuestionIds } }).select('subject correctAnswer');
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  const bySubject = {};

  attempts.forEach((attempt) => {
    attempt.answers.forEach((answer) => {
      const question = questionMap.get(answer.questionId.toString());
      if (!question) return;

      if (!bySubject[question.subject]) {
        bySubject[question.subject] = { correct: 0, total: 0 };
      }
      bySubject[question.subject].total += 1;
      if (answer.selectedOption === question.correctAnswer) {
        bySubject[question.subject].correct += 1;
      }
    });
  });

  const subjects = Object.entries(bySubject)
    .map(([subject, stats]) => ({
      subject,
      correct: stats.correct,
      total: stats.total,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // weakest first

  return { subjects, hasData: true };
};

module.exports = { computeSubjectAccuracy };
