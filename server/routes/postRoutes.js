const express = require('express');
const router = express.Router();
const { createPost, getFeed, toggleLike, addComment, deletePost, reportPost } = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const feedUpload = require('../middleware/feedUpload');

router.post('/', protect, feedUpload.single('media'), createPost);
router.get('/', protect, getFeed);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);
router.delete('/:id', protect, deletePost);
router.post('/:id/report', protect, reportPost);

module.exports = router;
