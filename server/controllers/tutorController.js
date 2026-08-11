const TutorProfile = require('../models/TutorProfile');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// @desc    Browse tutors, optionally filtered by subject
// @route   GET /api/tutors?subject=Physics
const getTutors = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subject) {
      filter.subjects = req.query.subject;
    }

    const profiles = await TutorProfile.find(filter)
      .populate('userId', 'name')
      .sort({ rating: -1, reviewCount: -1 });

    res.json({
      tutors: profiles.map((p) => ({
        id: p.userId._id,
        name: p.userId.name,
        bio: p.bio,
        subjects: p.subjects,
        hourlyRate: p.hourlyRate,
        yearsExperience: p.yearsExperience,
        sessionType: p.sessionType,
        isVerified: p.isVerified,
        rating: p.rating,
        reviewCount: p.reviewCount,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a tutor's full profile + reviews
// @route   GET /api/tutors/:userId
const getTutorById = async (req, res, next) => {
  try {
    const profile = await TutorProfile.findOne({ userId: req.params.userId }).populate('userId', 'name');
    if (!profile) {
      return res.status(404).json({ message: 'Tutor profile not found' });
    }

    const reviews = await Review.find({ tutorId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name');

    res.json({
      tutor: {
        id: profile.userId._id,
        name: profile.userId.name,
        bio: profile.bio,
        subjects: profile.subjects,
        hourlyRate: profile.hourlyRate,
        yearsExperience: profile.yearsExperience,
        sessionType: profile.sessionType,
        isVerified: profile.isVerified,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
      },
      reviews: reviews.map((r) => ({
        id: r._id,
        studentName: r.studentId.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in user's own tutor profile, if any
// @route   GET /api/tutors/me/profile
const getMyTutorProfile = async (req, res, next) => {
  try {
    const profile = await TutorProfile.findOne({ userId: req.user._id });
    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update the logged-in user's tutor profile ("become a tutor")
// @route   PUT /api/tutors/me/profile
const upsertMyTutorProfile = async (req, res, next) => {
  try {
    const { bio, subjects, hourlyRate, yearsExperience, sessionType } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Select at least one subject you can teach' });
    }
    if (hourlyRate === undefined || hourlyRate < 0) {
      return res.status(400).json({ message: 'A valid hourly rate is required' });
    }

    const profile = await TutorProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        bio: bio || '',
        subjects,
        hourlyRate,
        yearsExperience: yearsExperience || 0,
        sessionType: sessionType || 'online',
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: 'Tutor profile saved', profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a review for a tutor — must have at least one booking with them
// @route   POST /api/tutors/:userId/reviews
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const tutorId = req.params.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (tutorId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't review yourself" });
    }

    const hasBooking = await Booking.findOne({ studentId: req.user._id, tutorId });
    if (!hasBooking) {
      return res.status(403).json({ message: 'Book a session with this tutor before leaving a review' });
    }

    const existing = await Review.findOne({ tutorId, studentId: req.user._id });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment || '';
      await existing.save();
    } else {
      await Review.create({ tutorId, studentId: req.user._id, rating, comment: comment || '' });
    }

    // Recompute the tutor's aggregate rating
    const allReviews = await Review.find({ tutorId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await TutorProfile.findOneAndUpdate(
      { userId: tutorId },
      { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length }
    );

    res.status(201).json({ message: 'Review submitted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in tutor's dashboard stats
// @route   GET /api/tutors/me/dashboard-stats
const getDashboardStats = async (req, res, next) => {
  try {
    const profile = await TutorProfile.findOne({ userId: req.user._id });

    const [pendingCount, upcomingBookings, completedCount, successfulPayments] = await Promise.all([
      Booking.countDocuments({ tutorId: req.user._id, status: 'pending' }),
      Booking.find({ tutorId: req.user._id, status: 'accepted' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('studentId', 'name'),
      Booking.countDocuments({ tutorId: req.user._id, status: 'completed' }),
      Payment.find({ tutorId: req.user._id, status: 'success' }).select('amount'),
    ]);

    const totalEarnings = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      pendingCount,
      completedCount,
      rating: profile?.rating || 0,
      reviewCount: profile?.reviewCount || 0,
      totalEarnings,
      paidSessionsCount: successfulPayments.length,
      hourlyRate: profile?.hourlyRate || 0,
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b._id,
        studentName: b.studentId.name,
        subject: b.subject,
        preferredTime: b.preferredTime,
        amount: b.amount,
        isPaid: b.isPaid,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTutors, getTutorById, getMyTutorProfile, upsertMyTutorProfile, createReview, getDashboardStats };
