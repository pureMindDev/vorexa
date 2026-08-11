import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiTrash2, FiSend, FiFlag, FiImage, FiFile, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { createPost, createPostWithMedia, getFeed, toggleLike, addComment, deletePost, reportPost } from '../../services/postService';
import { useCursorList } from '../../hooks/useCursorList';
import styles from './Feed.module.scss';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const Feed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedPreview, setAttachedPreview] = useState(null); // object URL, for images/video only
  const fileInputRef = useRef(null);

  // Cursor pagination instead of one fat 50-post request: the first screen paints from a
  // small page, and older posts stream in as the sentinel scrolls into view.
  const fetchPage = useCallback(async (cursor) => {
    const { data } = await getFeed({ cursor, limit: 15 });
    return { items: data.posts, nextCursor: data.nextCursor };
  }, []);

  const {
    items: posts,
    setItems: setPosts,
    loading,
    loadingMore,
    hasMore,
    error: listError,
    sentinelRef,
    refresh: load,
  } = useCursorList(fetchPage);

  const MAX_FILE_MB = 50;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_FILE_MB}MB — pick a smaller one.`);
      return;
    }
    setError('');
    setAttachedFile(file);
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setAttachedPreview(URL.createObjectURL(file));
    } else {
      setAttachedPreview(null);
    }
  };

  const clearAttachment = () => {
    if (attachedPreview) URL.revokeObjectURL(attachedPreview);
    setAttachedFile(null);
    setAttachedPreview(null);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !attachedFile) return;
    setPosting(true);
    setError('');
    try {
      const { data } = attachedFile
        ? await createPostWithMedia(newPost.trim(), attachedFile)
        : await createPost(newPost.trim());
      setPosts((prev) => [data.post, ...prev]);
      setNewPost('');
      clearAttachment();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create post.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p
      )
    );
    try {
      await toggleLike(postId);
    } catch {
      load(); // resync on failure
    }
  };

  const handleDelete = async (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await deletePost(postId);
    } catch {
      load();
    }
  };

  const [reportedIds, setReportedIds] = useState({});
  const handleReport = async (postId) => {
    const reason = window.prompt('Why are you reporting this post?');
    if (!reason?.trim()) return;
    try {
      await reportPost(postId, reason.trim());
      setReportedIds((prev) => ({ ...prev, [postId]: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit the report.');
    }
  };

  const handleComment = async (postId) => {
    const content = commentDrafts[postId];
    if (!content?.trim()) return;
    try {
      const { data } = await addComment(postId, content);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: [...p.comments, data.comment].slice(-3), commentCount: data.commentCount }
            : p
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add comment.');
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Feed</h1>
        <p className={styles.subtitle}>See what other students are studying and sharing.</p>
      </div>

      <div className={styles.composer}>
        <form onSubmit={handlePost}>
          <div className={styles.composerRow}>
            <div className={styles.avatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
            <textarea
              className={styles.composerInput}
              placeholder="Share a study tip, a win, or a question..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
          </div>

          {attachedFile && (
            <div className={styles.attachmentPreview}>
              {attachedFile.type.startsWith('image/') && (
                <img src={attachedPreview} alt="Attachment preview" className={styles.attachmentPreviewImg} />
              )}
              {attachedFile.type.startsWith('video/') && (
                <video src={attachedPreview} className={styles.attachmentPreviewImg} controls />
              )}
              {!attachedFile.type.startsWith('image/') && !attachedFile.type.startsWith('video/') && (
                <div className={styles.attachmentPreviewFile}>
                  <FiFile size={18} />
                  <span>{attachedFile.name}</span>
                </div>
              )}
              <button type="button" className={styles.attachmentRemoveBtn} onClick={clearAttachment} aria-label="Remove attachment">
                <FiX size={14} />
              </button>
            </div>
          )}

          <div className={styles.composerFooter}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a photo, video, or file"
              title="Attach a photo, video, or file"
            >
              <FiImage size={17} />
            </button>
            <button className={styles.postBtn} type="submit" disabled={posting || (!newPost.trim() && !attachedFile)}>
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {(error || listError) && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error || listError}</p>}
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading feed...</p>}
      {!loading && posts.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No posts yet — be the first to share something.</p>
      )}

      {posts.map((post) => (
        <div key={post.id} className={styles.post}>
          <div className={styles.postHeader}>
            <div className={styles.avatar}>{post.authorName?.charAt(0)?.toUpperCase()}</div>
            <div className={styles.postAuthorInfo}>
              <div className={styles.postAuthor} onClick={() => navigate(`/users/${post.authorId}`)}>
                {post.authorName}
              </div>
              <div className={styles.postTime}>{timeAgo(post.createdAt)}</div>
            </div>
            {post.authorId === user?._id ? (
              <button className={styles.deletePostBtn} onClick={() => handleDelete(post.id)} aria-label="Delete post">
                <FiTrash2 size={15} />
              </button>
            ) : (
              <button
                className={styles.deletePostBtn}
                onClick={() => handleReport(post.id)}
                disabled={reportedIds[post.id]}
                aria-label="Report post"
                title={reportedIds[post.id] ? 'Reported' : 'Report post'}
              >
                <FiFlag size={15} />
              </button>
            )}
          </div>

          {post.content && <p className={styles.postContent}>{post.content}</p>}

          {post.media?.url && (
            <div className={styles.postMedia}>
              {post.media.type === 'image' && (
                <img src={post.media.url} alt="" className={styles.postMediaImg} loading="lazy" />
              )}
              {post.media.type === 'video' && (
                <video src={post.media.url} className={styles.postMediaImg} controls preload="metadata" />
              )}
              {post.media.type === 'raw' && (
                <a href={post.media.url} target="_blank" rel="noreferrer" className={styles.postMediaFile}>
                  <FiFile size={18} />
                  <span>{post.media.originalName || 'Download attachment'}</span>
                </a>
              )}
            </div>
          )}

          <div className={styles.postActions}>
            <button
              className={`${styles.actionBtn} ${post.isLiked ? styles['actionBtn--liked'] : ''}`}
              onClick={() => handleLike(post.id)}
            >
              <FiHeart size={15} fill={post.isLiked ? '#EF4444' : 'none'} />
              {post.likeCount}
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
            >
              <FiMessageCircle size={15} />
              {post.commentCount}
            </button>
          </div>

          {openComments[post.id] && (
            <div className={styles.commentsSection}>
              {post.comments.map((c) => (
                <div key={c.id} className={styles.comment}>
                  <div className={styles.commentAvatar}>{c.authorName?.charAt(0)?.toUpperCase()}</div>
                  <div className={styles.commentBubble}>
                    <div className={styles.commentAuthor}>{c.authorName}</div>
                    <div className={styles.commentText}>{c.content}</div>
                  </div>
                </div>
              ))}
              <div className={styles.commentComposer}>
                <input
                  className={styles.commentInput}
                  placeholder="Write a comment..."
                  value={commentDrafts[post.id] || ''}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                />
                <button className={styles.commentSendBtn} onClick={() => handleComment(post.id)} aria-label="Send comment">
                  <FiSend size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div ref={sentinelRef} />
      {loadingMore && (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Loading more…</p>
      )}
      {!loading && !hasMore && posts.length > 0 && (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem', fontSize: '0.8125rem' }}>
          You're all caught up.
        </p>
      )}
    </div>
  );
};

export default Feed;
