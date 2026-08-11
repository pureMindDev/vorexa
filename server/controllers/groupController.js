const crypto = require('crypto');
const StudyGroup = require('../models/StudyGroup');
const GroupPost = require('../models/GroupPost');
const { notify } = require('../services/notificationService');

const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const isMember = (group, userId) =>
  group.members.some((m) => m.userId.toString() === userId.toString());

const toSummary = (group, userId) => ({
  id: group._id,
  name: group.name,
  description: group.description,
  subject: group.subject,
  isPrivate: group.isPrivate,
  memberCount: group.members.length,
  isMember: isMember(group, userId),
  createdAt: group.createdAt,
});

// @desc    Create a new study group
// @route   POST /api/groups
const createGroup = async (req, res, next) => {
  try {
    const { name, description, subject, isPrivate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await StudyGroup.create({
      name: name.trim(),
      description: description?.trim() || '',
      subject: subject || '',
      isPrivate: !!isPrivate,
      inviteCode: isPrivate ? generateInviteCode() : undefined,
      createdBy: req.user._id,
      members: [{ userId: req.user._id, role: 'admin', joinedAt: new Date() }],
    });

    res.status(201).json({ group: toSummary(group, req.user._id), inviteCode: group.inviteCode });
  } catch (error) {
    next(error);
  }
};

// @desc    Browse public groups, or the logged-in user's own groups
// @route   GET /api/groups?subject=Physics&mine=true
const getGroups = async (req, res, next) => {
  try {
    const { subject, mine } = req.query;
    const filter = {};

    if (mine === 'true') {
      filter['members.userId'] = req.user._id;
    } else {
      filter.isPrivate = false;
    }
    if (subject) {
      filter.subject = subject;
    }

    const groups = await StudyGroup.find(filter).sort({ createdAt: -1 }).limit(50);

    res.json({ groups: groups.map((g) => toSummary(g, req.user._id)) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single group's detail (member list, restricted if private and not a member)
// @route   GET /api/groups/:id
const getGroupById = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id).populate('members.userId', 'name');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberOfGroup = isMember(group, req.user._id);

    if (group.isPrivate && !memberOfGroup) {
      return res.json({
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          subject: group.subject,
          isPrivate: true,
          memberCount: group.members.length,
          isMember: false,
        },
      });
    }

    const isAdmin = group.members.some(
      (m) => m.userId._id.toString() === req.user._id.toString() && m.role === 'admin'
    );

    res.json({
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        subject: group.subject,
        isPrivate: group.isPrivate,
        memberCount: group.members.length,
        isMember: memberOfGroup,
        inviteCode: isAdmin ? group.inviteCode : undefined,
        members: group.members.map((m) => ({
          id: m.userId._id,
          name: m.userId.name,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a group — public groups join directly, private groups need an invite code
// @route   POST /api/groups/:id/join
const joinGroup = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (isMember(group, req.user._id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }
    if (group.isPrivate && group.inviteCode !== inviteCode?.toUpperCase()) {
      return res.status(403).json({ message: 'Invalid invite code' });
    }

    group.members.push({ userId: req.user._id, role: 'member', joinedAt: new Date() });
    await group.save();

    res.json({ message: 'Joined group', group: toSummary(group, req.user._id) });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a group — auto-promotes the next member to admin if the last admin leaves,
//          and deletes the group if the last member leaves
// @route   POST /api/groups/:id/leave
const leaveGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    group.members = group.members.filter((m) => m.userId.toString() !== req.user._id.toString());

    if (group.members.length === 0) {
      await StudyGroup.findByIdAndDelete(group._id);
      await GroupPost.deleteMany({ groupId: group._id });
      return res.json({ message: 'You left the group and it was removed (no members left)' });
    }

    const stillHasAdmin = group.members.some((m) => m.role === 'admin');
    if (!stillHasAdmin) {
      group.members[0].role = 'admin'; // promote the longest-standing remaining member
    }

    await group.save();
    res.json({ message: 'Left group' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts (announcements/discussion) for a group — members only
// @route   GET /api/groups/:id/posts
const getGroupPosts = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Join this group to see its posts' });
    }

    const posts = await GroupPost.find({ groupId: group._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name');

    res.json({
      posts: posts.map((p) => ({
        id: p._id,
        content: p.content,
        authorName: p.userId.name,
        authorId: p.userId._id,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post an announcement/message to a group — members only
// @route   POST /api/groups/:id/posts
const createGroupPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (!isMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Join this group to post' });
    }

    const post = await GroupPost.create({
      groupId: group._id,
      userId: req.user._id,
      content: content.trim(),
    });

    const otherMemberIds = group.members
      .map((m) => m.userId.toString())
      .filter((memberId) => memberId !== req.user._id.toString());

    await Promise.all(
      otherMemberIds.map((memberId) =>
        notify({
          userId: memberId,
          type: 'group_post',
          title: `New post in ${group.name}`,
          message: `${req.user.name}: ${content.trim().slice(0, 80)}${content.trim().length > 80 ? '...' : ''}`,
          link: `/groups/${group._id}`,
        })
      )
    );

    res.status(201).json({
      post: {
        id: post._id,
        content: post.content,
        authorName: req.user.name,
        authorId: req.user._id,
        createdAt: post.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  createGroupPost,
};
