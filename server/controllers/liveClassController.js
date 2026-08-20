const LiveClass = require('../models/LiveClass');
const LiveClassAttendance = require('../models/LiveClassAttendance');
const Booking = require('../models/Booking');
const StudyGroup = require('../models/StudyGroup');
const CentreMember = require('../models/CentreMember');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { emitToUser } = require('../config/socket');

// Different account types land on different route trees (student/tutor/centre), so the
// notification's deep link has to match wherever that recipient will actually find the room.
const liveClassLinkFor = (role, liveClassId) => {
  if (role === 'tutor') return `/tutor/live-classes/${liveClassId}`;
  if (role === 'centre') return `/centre/live-classes/${liveClassId}`;
  return `/live-classes/${liveClassId}`;
};

// Resolves who is allowed into a given live class, and returns the other participants
// (for notifications) alongside the boolean.
const resolveAccess = async (liveClass, userId) => {
  if (liveClass.hostId.toString() === userId.toString()) {
    return { allowed: true };
  }
  if (liveClass.bookingId) {
    const booking = await Booking.findById(liveClass.bookingId);
    if (!booking) return { allowed: false };
    const allowed = [booking.studentId.toString(), booking.tutorId.toString()].includes(userId.toString());
    return { allowed };
  }
  if (liveClass.groupId) {
    const group = await StudyGroup.findById(liveClass.groupId).select('members');
    if (!group) return { allowed: false };
    const allowed = group.members.some((m) => m.userId.toString() === userId.toString());
    return { allowed };
  }
  if (liveClass.centreId) {
    const membership = await CentreMember.findOne({ centreId: liveClass.centreId, userId, status: 'active' });
    return { allowed: !!membership };
  }
  // No booking/group/centre — this is a tutor's open class. Anyone with an accepted
  // booking with this host can join, without the tutor having had to pick one up front.
  const openBooking = await Booking.findOne({ tutorId: liveClass.hostId, studentId: userId, status: 'accepted' });
  return { allowed: !!openBooking };
};

// Every other participant on a live class, regardless of whether it's a booking, group, or
// centre class — used for both the "scheduled" and "starting now" notifications.
const getParticipantIds = async (liveClass, excludeUserId) => {
  if (liveClass.bookingId) {
    const booking = await Booking.findById(liveClass.bookingId);
    if (!booking) return [];
    return [booking.studentId, booking.tutorId].filter((id) => id.toString() !== excludeUserId.toString());
  }
  if (liveClass.groupId) {
    const group = await StudyGroup.findById(liveClass.groupId).select('members');
    if (!group) return [];
    return group.members.map((m) => m.userId).filter((id) => id.toString() !== excludeUserId.toString());
  }
  if (liveClass.centreId) {
    const members = await CentreMember.find({ centreId: liveClass.centreId, status: 'active' }).select('userId');
    return members.map((m) => m.userId).filter((id) => id.toString() !== excludeUserId.toString());
  }
  // Open tutor class — every student with an accepted booking with this host is a participant.
  const openBookings = await Booking.find({ tutorId: liveClass.hostId, status: 'accepted' }).select('studentId');
  return openBookings.map((b) => b.studentId).filter((id) => id.toString() !== excludeUserId.toString());
};

// Sends a notification (and a live socket push, in case they already have the app open)
// to every other participant, using the correct deep link for their account type.
const notifyParticipants = async (liveClass, excludeUserId, { title, message }) => {
  const participantIds = await getParticipantIds(liveClass, excludeUserId);
  if (participantIds.length === 0) return;

  const users = await User.find({ _id: { $in: participantIds } }).select('role');
  const roleById = new Map(users.map((u) => [u._id.toString(), u.role]));

  await Promise.all(
    participantIds.map((id) => {
      const link = liveClassLinkFor(roleById.get(id.toString()), liveClass._id);
      emitToUser(id, 'live:class-status-changed', { liveClassId: liveClass._id, status: liveClass.status });
      return notify({ userId: id, type: 'system', title, message, link });
    })
  );
};

const toSummary = (lc) => ({
  id: lc._id,
  title: lc.title,
  subject: lc.subject,
  hostId: lc.hostId._id || lc.hostId,
  hostName: lc.hostId.name || undefined,
  bookingId: lc.bookingId,
  groupId: lc.groupId,
  centreId: lc.centreId,
  roomCode: lc.roomCode,
  scheduledFor: lc.scheduledFor,
  durationMinutes: lc.durationMinutes,
  status: lc.status,
  startedAt: lc.startedAt,
  endedAt: lc.endedAt,
});

// @desc    Schedule a live class, tied to a booking (1:1), a study group, or a tutorial centre
// @route   POST /api/live-classes
const createLiveClass = async (req, res, next) => {
  try {
    const { title, subject, bookingId, groupId, centreId, scheduledFor, durationMinutes } = req.body;

    if (!title?.trim() || !scheduledFor) {
      return res.status(400).json({ message: 'Title and scheduled time are required' });
    }
    const scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      return res.status(400).json({ message: 'Please choose a valid time in the future' });
    }
    // A tutor doesn't have to pick a specific booking or group up front — scheduling one
    // shouldn't be blocked just because they have no accepted booking yet. Left untied, the
    // class is open to any student with an accepted booking with this tutor (see
    // resolveAccess/getParticipantIds below). Students and centres still need to pick a
    // group/centre since "all my tutors" isn't a coherent scope for them.
    if (!bookingId && !groupId && !centreId && req.user.role !== 'tutor') {
      return res.status(400).json({ message: 'A live class must be tied to a booking, a study group, or a centre' });
    }

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      if (![booking.studentId.toString(), booking.tutorId.toString()].includes(req.user._id.toString())) {
        return res.status(403).json({ message: 'You are not part of this booking' });
      }
    } else if (groupId) {
      const group = await StudyGroup.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      if (!group.members.some((m) => m.userId.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'You are not a member of this group' });
      }
    } else if (centreId) {
      const membership = await CentreMember.findOne({ centreId, userId: req.user._id, status: 'active' });
      if (!membership) return res.status(403).json({ message: 'You are not an active member of this centre' });
    }
    // else: a tutor scheduling with no booking/group/centre — an intentionally open class,
    // no membership check needed (see comment above).

    const liveClass = await LiveClass.create({
      hostId: req.user._id,
      title: title.trim(),
      subject: subject?.trim() || '',
      bookingId: bookingId || null,
      groupId: groupId || null,
      centreId: centreId || null,
      scheduledFor: scheduledDate,
      durationMinutes: durationMinutes || 60,
    });

    await notifyParticipants(liveClass, req.user._id, {
      title: `Live class scheduled: ${liveClass.title}`,
      message: `${req.user.name} scheduled it for ${scheduledDate.toLocaleString()}`,
    });

    res.status(201).json({ liveClass: toSummary(liveClass) });
  } catch (error) {
    next(error);
  }
};

// @desc    List live classes the user can access — hosted, from their bookings, or their groups
// @route   GET /api/live-classes
const getMyLiveClasses = async (req, res, next) => {
  try {
    const myBookings = await Booking.find({
      $or: [{ studentId: req.user._id }, { tutorId: req.user._id }],
    }).select('_id');
    const myGroups = await StudyGroup.find({ 'members.userId': req.user._id }).select('_id');
    const myCentreMemberships = await CentreMember.find({ userId: req.user._id, status: 'active' }).select('centreId');

    const classes = await LiveClass.find({
      $or: [
        { hostId: req.user._id },
        { bookingId: { $in: myBookings.map((b) => b._id) } },
        { groupId: { $in: myGroups.map((g) => g._id) } },
        { centreId: { $in: myCentreMemberships.map((m) => m.centreId) } },
      ],
      status: { $ne: 'cancelled' },
    })
      .populate('hostId', 'name')
      .sort({ scheduledFor: 1 });

    res.json({ liveClasses: classes.map(toSummary) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single live class's details (access-checked)
// @route   GET /api/live-classes/:id
const getLiveClass = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id).populate('hostId', 'name');
    if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

    const { allowed } = await resolveAccess(liveClass, req.user._id);
    if (!allowed) return res.status(403).json({ message: 'You do not have access to this live class' });

    res.json({ liveClass: toSummary(liveClass), isHost: liveClass.hostId._id.toString() === req.user._id.toString() });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a scheduled live class (host only)
// @route   PUT /api/live-classes/:id/start
const startLiveClass = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ message: 'Live class not found' });
    if (liveClass.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can start this class' });
    }

    liveClass.status = 'live';
    liveClass.startedAt = new Date();
    await liveClass.save();

    // This is the moment a participant actually needs to know — without this, nobody
    // finds out the class is happening unless they're already staring at the page.
    await notifyParticipants(liveClass, req.user._id, {
      title: `${liveClass.title} is starting now`,
      message: `${req.user.name} just started the class — join now.`,
    });

    res.json({ liveClass: toSummary(liveClass) });
  } catch (error) {
    next(error);
  }
};

// @desc    End a live class (host only)
// @route   PUT /api/live-classes/:id/end
const endLiveClass = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ message: 'Live class not found' });
    if (liveClass.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can end this class' });
    }

    liveClass.status = 'ended';
    liveClass.endedAt = new Date();
    await liveClass.save();

    await LiveClassAttendance.updateMany(
      { liveClassId: liveClass._id, leftAt: null },
      { leftAt: new Date() }
    );

    // Push to anyone still in the room right now so their client can leave cleanly,
    // rather than being left talking to a host that's already gone.
    const participantIds = await getParticipantIds(liveClass, req.user._id);
    participantIds.forEach((id) =>
      emitToUser(id, 'live:class-status-changed', { liveClassId: liveClass._id, status: 'ended' })
    );

    res.json({ liveClass: toSummary(liveClass) });
  } catch (error) {
    next(error);
  }
};

// @desc    Record that the current user joined the live class (called when they enter the room)
// @route   POST /api/live-classes/:id/attendance/join
const recordJoin = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

    const { allowed } = await resolveAccess(liveClass, req.user._id);
    if (!allowed) return res.status(403).json({ message: 'You do not have access to this live class' });

    const record = await LiveClassAttendance.create({ liveClassId: liveClass._id, userId: req.user._id });
    res.status(201).json({ attendanceId: record._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Record that the current user left (called on leaving the room / tab close)
// @route   POST /api/live-classes/:id/attendance/leave
const recordLeave = async (req, res, next) => {
  try {
    await LiveClassAttendance.findOneAndUpdate(
      { liveClassId: req.params.id, userId: req.user._id, leftAt: null },
      { leftAt: new Date() },
      { sort: { joinedAt: -1 } }
    );
    res.json({ message: 'ok' });
  } catch (error) {
    next(error);
  }
};

// @desc    Attendance report for a class (host only)
// @route   GET /api/live-classes/:id/attendance
const getAttendance = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ message: 'Live class not found' });
    if (liveClass.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can view attendance' });
    }

    const records = await LiveClassAttendance.find({ liveClassId: liveClass._id })
      .populate('userId', 'name email')
      .sort({ joinedAt: 1 });

    res.json({ attendance: records });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLiveClass,
  getMyLiveClasses,
  getLiveClass,
  startLiveClass,
  endLiveClass,
  recordJoin,
  recordLeave,
  getAttendance,
  resolveAccess,
};
