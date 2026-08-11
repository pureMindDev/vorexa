const AccountabilityPartnership = require('../models/AccountabilityPartnership');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const { notify } = require('../services/notificationService');

const otherUserId = (partnership, userId) =>
  partnership.userA.toString() === userId.toString() ? partnership.userB : partnership.userA;

const toSummary = (p, currentUserId) => ({
  id: p._id,
  partner: p.otherUser, // populated by caller
  status: p.status,
  goal: p.goal,
  isIncoming: p.requestedBy.toString() !== currentUserId.toString() && p.status === 'pending',
  createdAt: p.createdAt,
});

// @desc    Send an accountability partner request by email
// @route   POST /api/accountability/requests
const sendRequest = async (req, res, next) => {
  try {
    const { email, goal } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ message: "The partner's email is required" });
    }

    const partner = await User.findOne({ email: email.toLowerCase().trim() });
    if (!partner) {
      return res.status(404).json({ message: 'No Vorexa user found with that email' });
    }
    if (partner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't partner with yourself" });
    }

    const existing = await AccountabilityPartnership.findOne({
      $or: [
        { userA: req.user._id, userB: partner._id },
        { userA: partner._id, userB: req.user._id },
      ],
      status: { $in: ['pending', 'active'] },
    });
    if (existing) {
      return res.status(400).json({ message: 'A pending or active partnership with this user already exists' });
    }

    const partnership = await AccountabilityPartnership.create({
      userA: req.user._id,
      userB: partner._id,
      requestedBy: req.user._id,
      goal: goal?.trim() || '',
    });

    await notify({
      userId: partner._id,
      type: 'system',
      title: 'New accountability partner request',
      message: `${req.user.name} wants to be your accountability partner.`,
      link: '/accountability',
    });

    res.status(201).json({ partnership });
  } catch (error) {
    next(error);
  }
};

// @desc    List the logged-in user's partnerships (active + pending, incoming + outgoing)
// @route   GET /api/accountability/requests
const getMyPartnerships = async (req, res, next) => {
  try {
    const partnerships = await AccountabilityPartnership.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
      status: { $in: ['pending', 'active'] },
    })
      .populate('userA', 'name email xp streakCount')
      .populate('userB', 'name email xp streakCount')
      .sort({ createdAt: -1 });

    const result = partnerships.map((p) => {
      const partnerDoc = p.userA._id.toString() === req.user._id.toString() ? p.userB : p.userA;
      return toSummary(
        { ...p.toObject(), otherUser: { id: partnerDoc._id, name: partnerDoc.name, xp: partnerDoc.xp, streakCount: partnerDoc.streakCount } },
        req.user._id
      );
    });

    res.json({ partnerships: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept or decline a pending request
// @route   PUT /api/accountability/requests/:id
const respondToRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    const partnership = await AccountabilityPartnership.findById(req.params.id);
    if (!partnership) return res.status(404).json({ message: 'Request not found' });

    const isParticipant = [partnership.userA.toString(), partnership.userB.toString()].includes(
      req.user._id.toString()
    );
    const isRecipient = isParticipant && partnership.requestedBy.toString() !== req.user._id.toString();
    if (!isRecipient) {
      return res.status(403).json({ message: 'Only the recipient can respond to this request' });
    }
    if (partnership.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been handled' });
    }

    partnership.status = action === 'accept' ? 'active' : 'declined';
    await partnership.save();

    if (action === 'accept') {
      await notify({
        userId: partnership.requestedBy,
        type: 'system',
        title: 'Accountability partner request accepted',
        message: `${req.user.name} accepted your partnership request!`,
        link: '/accountability',
      });
    }

    res.json({ partnership });
  } catch (error) {
    next(error);
  }
};

// @desc    End an active partnership
// @route   DELETE /api/accountability/requests/:id
const endPartnership = async (req, res, next) => {
  try {
    const partnership = await AccountabilityPartnership.findById(req.params.id);
    if (!partnership) return res.status(404).json({ message: 'Partnership not found' });

    const isParticipant = [partnership.userA.toString(), partnership.userB.toString()].includes(
      req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Not your partnership' });

    partnership.status = 'ended';
    await partnership.save();
    res.json({ message: 'Partnership ended' });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a daily check-in to a partnership
// @route   POST /api/accountability/:id/checkins
const postCheckIn = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Check-in content is required' });

    const partnership = await AccountabilityPartnership.findById(req.params.id);
    if (!partnership || partnership.status !== 'active') {
      return res.status(404).json({ message: 'Active partnership not found' });
    }
    const isParticipant = [partnership.userA.toString(), partnership.userB.toString()].includes(
      req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Not your partnership' });

    const checkIn = await CheckIn.create({ partnershipId: partnership._id, userId: req.user._id, content: content.trim() });

    await notify({
      userId: otherUserId(partnership, req.user._id),
      type: 'system',
      title: `${req.user.name} checked in`,
      message: content.trim().slice(0, 100),
      link: '/accountability',
    });

    res.status(201).json({ checkIn });
  } catch (error) {
    next(error);
  }
};

// @desc    Get check-ins for a partnership
// @route   GET /api/accountability/:id/checkins
const getCheckIns = async (req, res, next) => {
  try {
    const partnership = await AccountabilityPartnership.findById(req.params.id);
    if (!partnership) return res.status(404).json({ message: 'Partnership not found' });
    const isParticipant = [partnership.userA.toString(), partnership.userB.toString()].includes(
      req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Not your partnership' });

    const checkIns = await CheckIn.find({ partnershipId: partnership._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ checkIns });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRequest,
  getMyPartnerships,
  respondToRequest,
  endPartnership,
  postCheckIn,
  getCheckIns,
};
