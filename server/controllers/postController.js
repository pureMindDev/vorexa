const Post = require('../models/Post');
const Report = require('../models/Report');
const { notify } = require('../services/notificationService');
const { parseLimit, cursorFilter, paginate } = require('../utils/pagination');
const { uploadBuffer, cloudinary } = require('../config/cloudinary');


const toFeedItem = (post, currentUserId) => ({
  id: post._id,
  authorId: post.userId._id,
  authorName: post.userId.name,
  content: post.content,
  media: post.media?.url
    ? { url: post.media.url, type: post.media.type, originalName: post.media.originalName }
    : null,
  likeCount: post.likes.length,
  isLiked: post.likes.some((id) => id.toString() === currentUserId.toString()),
  commentCount: post.comments.length,
  comments: post.comments
    .slice(-3) // only send the most recent 3 inline — keeps the feed payload light
    .map((c) => ({
      id: c._id,
      authorId: c.userId,
      content: c.content,
      createdAt: c.createdAt,
    })),
  createdAt: post.createdAt,
});

// Cloudinary resource_type is either 'image', 'video', or 'raw' — everything that isn't a
// recognized image/video mimetype (PDFs, docs, etc) gets uploaded and stored as 'raw'.
const resourceTypeFor = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw';
};

// @desc    Create a post — text, a media attachment (image/video/file), or both
// @route   POST /api/posts
const createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const trimmedContent = (content || '').trim();

    if (!trimmedContent && !req.file) {
      return res.status(400).json({ message: 'Write something or attach a file to post' });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME && req.file) {
      return res.status(503).json({
        message: 'Media uploads are not configured yet — add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the server .env file',
      });
    }

    let media;
    if (req.file) {
      const resourceType = resourceTypeFor(req.file.mimetype);
      const result = await uploadBuffer(req.file.buffer, {
        folder: `vorexa/feed/${req.user._id}`,
        resourceType,
        originalName: req.file.originalname,
      });
      media = {
        url: result.secure_url,
        type: resourceType,
        publicId: result.public_id,
        originalName: req.file.originalname,
        bytes: result.bytes,
      };
    }

    const post = await Post.create({ userId: req.user._id, content: trimmedContent, media });
    await post.populate('userId', 'name');

    res.status(201).json({ post: toFeedItem(post, req.user._id) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the global home feed (or a specific user's posts if userId is given)
// @route   GET /api/posts?userId=&cursor=&limit=
// Cursor-paginated: pass back `nextCursor` from the previous response to load older posts.
const getFeed = async (req, res, next) => {
  try {
    const filter = req.query.userId ? { userId: req.query.userId } : {};
    const limit = parseLimit(req.query.limit, 15);
    const paged = await paginate(
      Post.find({ ...filter, ...cursorFilter(req.query.cursor) })
        .populate('userId', 'name')
        .populate('comments.userId', 'name'),
      { limit }
    );

    res.json({
      posts: paged.docs.map((post) => {
        const item = toFeedItem(post, req.user._id);
        // include commenter names for the inline preview
        item.comments = post.comments.slice(-3).map((c) => ({
          id: c._id,
          authorId: c.userId?._id || c.userId,
          authorName: c.userId?.name,
          content: c.content,
          createdAt: c.createdAt,
        }));
        return item;
      }),
      nextCursor: paged.nextCursor,
      hasMore: paged.hasMore,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle a like on a post
// @route   POST /api/posts/:id/like
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === req.user._id.toString());

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();

    if (!alreadyLiked && post.userId.toString() !== req.user._id.toString()) {
      await notify({
        userId: post.userId,
        type: 'post_like',
        title: 'New like on your post',
        message: `${req.user.name} liked your post.`,
        link: '/feed',
      });
    }

    res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({ userId: req.user._id, content: content.trim() });
    await post.save();

    if (post.userId.toString() !== req.user._id.toString()) {
      await notify({
        userId: post.userId,
        type: 'post_comment',
        title: 'New comment on your post',
        message: `${req.user.name} commented: ${content.trim().slice(0, 80)}`,
        link: '/feed',
      });
    }

    res.status(201).json({
      comment: {
        id: post.comments[post.comments.length - 1]._id,
        authorId: req.user._id,
        authorName: req.user.name,
        content: content.trim(),
        createdAt: new Date(),
      },
      commentCount: post.comments.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete your own post
// @route   DELETE /api/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.media?.publicId) {
      // Best-effort cleanup — a failed Cloudinary delete shouldn't block the post from
      // being removed from the feed (the DB record is already gone at this point).
      cloudinary.uploader
        .destroy(post.media.publicId, { resource_type: post.media.type === 'raw' ? 'raw' : post.media.type })
        .catch((err) => console.error('Cloudinary cleanup failed for', post.media.publicId, err.message));
    }
    res.json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a post for admin review
// @route   POST /api/posts/:id/report
const reportPost = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Please describe why you are reporting this post' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      targetType: 'post',
      targetId: post._id,
      reason: reason.trim(),
    });

    res.status(201).json({ message: 'Report submitted. Our team will review it.', report });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, getFeed, toggleLike, addComment, deletePost, reportPost };
