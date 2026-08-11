import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { createGroup } from '../../services/groupService';
import styles from './CreateGroup.module.scss';

const SUBJECTS = [
  'English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Government', 'Economics', 'Geography', 'Commerce', 'General',
];

const CreateGroup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('General');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await createGroup({ name, description, subject, isPrivate });
      navigate(`/groups/${data.group.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <span className={styles.back} onClick={() => navigate('/groups')}>&larr; Back to Study Groups</span>
      <h1 className={styles.title}>Create a study group</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          id="name"
          label="Group name"
          placeholder="e.g. Physics Warriors"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Description
          </label>
          <textarea
            className={styles.textarea}
            placeholder="What's this group about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Subject focus
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
              fontSize: '1rem',
            }}
          >
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Private group</div>
            <div className={styles.toggleDescription}>Only joinable with an invite code</div>
          </div>
          <div
            className={`${styles.switch} ${isPrivate ? styles['switch--on'] : ''}`}
            onClick={() => setIsPrivate((p) => !p)}
          >
            <div className={styles.switchKnob} />
          </div>
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        <Button type="submit" loading={loading}>Create group</Button>
      </form>
    </div>
  );
};

export default CreateGroup;
