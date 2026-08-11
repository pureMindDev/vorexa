import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getPublicProfile } from '../../services/userService';
import { getFollowStats, followUser, unfollowUser } from '../../services/followService';
import { startConversation } from '../../services/messageService';
import { getFeed } from '../../services/postService';
import { messagesBasePath } from '../../utils/roleRoutes';
import styles from './UserProfile.module.scss';
import feedStyles from '../Feed/Feed.module.scss';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  const load = async () => {
    try {
      const [profileRes, statsRes, postsRes] = await Promise.all([
        getPublicProfile(userId),
        getFollowStats(userId),
        getFeed(userId),
      ]);
      setProfile(profileRes.data.user);
      setStats(statsRes.data);
      setPosts(postsRes.data.posts);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    try {
      if (stats.isFollowing) {
        await unfollowUser(userId);
        setStats((prev) => ({ ...prev, isFollowing: false, followersCount: prev.followersCount - 1 }));
      } else {
        await followUser(userId);
        setStats((prev) => ({ ...prev, isFollowing: true, followersCount: prev.followersCount + 1 }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const { data } = await startConversation(userId);
      navigate(`${messagesBasePath(currentUser?.role)}/${data.conversationId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start a conversation.');
    }
  };

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>;
  if (error && !profile) return <p style={{ color: '#EF4444' }}>{error}</p>;
  if (!profile) return null;

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.avatar}>{profile.name?.charAt(0)?.toUpperCase()}</div>
        <div>
          <div className={styles.name}>{profile.name}</div>
          <div className={styles.statsRow}>
            <span><span className={styles.statValue}>{stats.followersCount}</span> <span className={styles.statLabel}>followers</span></span>
            <span><span className={styles.statValue}>{stats.followingCount}</span> <span className={styles.statLabel}>following</span></span>
            <span><span className={styles.statValue}>{profile.xp}</span> <span className={styles.statLabel}>XP</span></span>
          </div>
          {!isOwnProfile && (
            <div className={styles.actions}>
              <button
                className={`${styles.followBtn} ${stats.isFollowing ? styles['followBtn--following'] : ''}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {stats.isFollowing ? 'Following' : 'Follow'}
              </button>
              <button className={styles.messageBtn} onClick={handleMessage}>
                <FiMessageCircle size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                Message
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>}

      <h2 className={styles.sectionTitle}>Posts</h2>
      {posts.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>No posts yet.</p>
      )}
      {posts.map((post) => (
        <div key={post.id} className={feedStyles.post}>
          <p className={feedStyles.postContent}>{post.content}</p>
          <div className={feedStyles.postActions}>
            <span className={feedStyles.actionBtn}>❤️ {post.likeCount}</span>
            <span className={feedStyles.actionBtn}>💬 {post.commentCount}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserProfile;
