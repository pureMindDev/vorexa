import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUsers, FiLock, FiSend } from 'react-icons/fi';
import { getGroupById, joinGroup, leaveGroup, getGroupPosts, createGroupPost } from '../../services/groupService';
import StudyRoom from '../../components/StudyRoom/StudyRoom';
import SharedNotes from '../../components/SharedNotes/SharedNotes';
import SharedFlashcards from '../../components/SharedFlashcards/SharedFlashcards';
import styles from './GroupDetail.module.scss';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState('discussion');

  const loadGroup = async () => {
    try {
      const { data } = await getGroupById(id);
      setGroup(data.group);
      if (data.group.isMember) {
        const { data: postsData } = await getGroupPosts(id);
        setPosts(postsData.posts);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this group.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      await joinGroup(id, inviteCodeInput);
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join group.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(id);
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not leave group.');
    }
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      const { data } = await createGroupPost(id, postContent);
      setPosts((prev) => [data.post, ...prev]);
      setPostContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading group...</p>;
  if (!group) return <p style={{ color: '#EF4444' }}>{error || 'Group not found.'}</p>;

  return (
    <div>
      <span className={styles.back} onClick={() => navigate('/groups')}>&larr; Back to Study Groups</span>

      <div className={styles.header}>
        <div>
          <h1 className={styles.groupName}>{group.name}</h1>
          <div className={styles.groupMeta}>
            <FiUsers size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
            {group.isPrivate && <> &middot; <FiLock size={12} style={{ verticalAlign: '-1px', margin: '0 3px' }} />Private</>}
            {group.subject && <> &middot; {group.subject}</>}
          </div>
          {group.description && <p className={styles.groupDescription}>{group.description}</p>}
        </div>

        {!group.isMember ? (
          group.isPrivate ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                placeholder="Invite code"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', width: '140px' }}
              />
              <button className={styles.joinBtn} onClick={handleJoin} disabled={joining}>
                {joining ? 'Joining...' : 'Join'}
              </button>
            </div>
          ) : (
            <button className={styles.joinBtn} onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Join group'}
            </button>
          )
        ) : (
          <button className={styles.leaveBtn} onClick={handleLeave}>Leave group</button>
        )}
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>}

      {group.isMember && group.inviteCode && (
        <div className={styles.inviteBox}>
          <div className={styles.inviteLabel}>Invite code (share to let others join)</div>
          <div className={styles.inviteCode}>{group.inviteCode}</div>
        </div>
      )}

      {group.isMember ? (
        <>
          <div className={styles.groupTabs}>
            {['discussion', 'room', 'notes', 'flashcards'].map((t) => (
              <button
                key={t}
                className={`${styles.groupTab} ${tab === t ? styles['groupTab--active'] : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'discussion' && 'Discussion'}
                {t === 'room' && 'Study Room'}
                {t === 'notes' && 'Shared Notes'}
                {t === 'flashcards' && 'Flashcards'}
              </button>
            ))}
          </div>

          {tab === 'room' && <StudyRoom groupId={group.id} />}
          {tab === 'notes' && <SharedNotes groupId={group.id} />}
          {tab === 'flashcards' && <SharedFlashcards groupId={group.id} />}

          {tab === 'discussion' && (
        <div className={styles.layout}>
          <div className={styles.feedCard}>
            <h2 className={styles.sectionTitle}>Discussion</h2>

            <div className={styles.composer}>
              <textarea
                className={styles.composerInput}
                placeholder="Share something with the group..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <button className={styles.postSendBtn} onClick={handlePost} disabled={posting || !postContent.trim()}>
                <FiSend size={16} />
              </button>
            </div>

            {posts.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No posts yet — be the first to share something.
              </p>
            )}

            {posts.map((post) => (
              <div key={post.id} className={styles.post}>
                <div className={styles.postHeader}>
                  <div className={styles.postAvatar}>{post.authorName?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <div className={styles.postAuthor}>{post.authorName}</div>
                    <div className={styles.postTime}>{timeAgo(post.createdAt)}</div>
                  </div>
                </div>
                <div className={styles.postContent}>{post.content}</div>
              </div>
            ))}
          </div>

          <div className={styles.membersCard}>
            <h2 className={styles.sectionTitle}>Members</h2>
            {group.members?.map((m) => (
              <div key={m.id} className={styles.memberRow}>
                <div className={styles.memberAvatar}>{m.name?.charAt(0)?.toUpperCase()}</div>
                <div className={styles.memberName}>
                  {m.name}
                  {m.role === 'admin' && <span className={styles.adminTag}>ADMIN</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>
          {group.isPrivate ? 'Join with an invite code to see discussions and members.' : 'Join this group to see discussions and members.'}
        </p>
      )}
    </div>
  );
};

export default GroupDetail;
