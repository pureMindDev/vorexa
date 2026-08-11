const CVProfile = require('../models/CVProfile');
const Opportunity = require('../models/Opportunity');

// @desc    Get the logged-in user's CV
// @route   GET /api/career/cv
const getCv = async (req, res, next) => {
  try {
    const cv = await CVProfile.findOne({ userId: req.user._id });
    res.json({ cv });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update the logged-in user's CV
// @route   PUT /api/career/cv
const upsertCv = async (req, res, next) => {
  try {
    const { fullName, email, phone, address, summary, education, experience, skills, certifications } = req.body;

    const cv = await CVProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        fullName: fullName || '',
        email: email || '',
        phone: phone || '',
        address: address || '',
        summary: summary || '',
        education: education || [],
        experience: experience || [],
        skills: skills || [],
        certifications: certifications || [],
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ cv });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a tracked opportunity (scholarship/competition/internship)
// @route   POST /api/career/opportunities
const createOpportunity = async (req, res, next) => {
  try {
    const { title, provider, type, deadline, link, notes } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const opportunity = await Opportunity.create({
      userId: req.user._id,
      title: title.trim(),
      provider: provider || '',
      type: type || 'scholarship',
      deadline: deadline || null,
      link: link || '',
      notes: notes || '',
    });

    res.status(201).json({ opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tracked opportunities
// @route   GET /api/career/opportunities
const getOpportunities = async (req, res, next) => {
  try {
    const opportunities = await Opportunity.find({ userId: req.user._id }).sort({ deadline: 1, createdAt: -1 });
    res.json({ opportunities });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an opportunity's status
// @route   PUT /api/career/opportunities/:id
const updateOpportunity = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const opportunity = await Opportunity.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...(status && { status }), ...(notes !== undefined && { notes }) },
      { new: true }
    );
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    res.json({ opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a tracked opportunity
// @route   DELETE /api/career/opportunities/:id
const deleteOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    res.json({ message: 'Opportunity deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCv, upsertCv, createOpportunity, getOpportunities, updateOpportunity, deleteOpportunity };
