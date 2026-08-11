import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiLock, FiPlus } from 'react-icons/fi';
import { getGroups } from '../../services/groupService';
import styles from './StudyGroups.module.scss';

const StudyGroups = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('discover');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getGroups(tab === 'mine' ? { mine: true } : {});
        setGroups(data.groups);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load groups.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Study Groups</h1>
          <p className={styles.subtitle}>Learn together — join a group or start your own.</p>
        </div>
        <button className={styles.createBtn} onClick={() => navigate('/groups/create')}>
          <FiPlus size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
          Create group
        </button>
      </div>

      <div className={styles.tabs}>
        <div className={`${styles.tab} ${tab === 'discover' ? styles['tab--active'] : ''}`} onClick={() => setTab('discover')}>
          Discover
        </div>
        <div className={`${styles.tab} ${tab === 'mine' ? styles['tab--active'] : ''}`} onClick={() => setTab('mine')}>
          My groups
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading groups...</p>}
      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {!loading && !error && groups.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>
          {tab === 'mine'
            ? "You haven't joined any groups yet — check Discover to find one."
            : 'No public groups yet — be the first to create one.'}
        </p>
      )}

      <div className={styles.grid}>
        {groups.map((group) => (
          <div key={group.id} className={styles.card} onClick={() => navigate(`/groups/${group.id}`)}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><FiUsers size={18} /></div>
              {group.isPrivate && <span className={styles.privateBadge}><FiLock size={9} style={{ verticalAlign: '-1px', marginRight: '3px' }} />Private</span>}
            </div>
            <div className={styles.cardName}>{group.name}</div>
            <div className={styles.cardDescription}>{group.description || 'No description yet.'}</div>
            <div className={styles.cardFooter}>
              <span className={styles.memberCount}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
              {group.isMember && <span className={styles.joinedTag}>JOINED</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyGroups;
