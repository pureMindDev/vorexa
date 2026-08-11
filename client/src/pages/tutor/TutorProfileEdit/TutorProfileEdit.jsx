import { useState, useEffect } from 'react';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import { getMyTutorProfile, upsertMyTutorProfile } from '../../../services/tutorService';

const SUBJECTS = ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Government', 'Economics', 'Geography', 'Commerce'];

const TutorProfileEdit = () => {
  const [bio, setBio] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [sessionType, setSessionType] = useState('online');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMyTutorProfile()
      .then(({ data }) => {
        if (data.profile) {
          setBio(data.profile.bio || '');
          setSubjects(data.profile.subjects || []);
          setHourlyRate(String(data.profile.hourlyRate ?? ''));
          setYearsExperience(String(data.profile.yearsExperience ?? ''));
          setSessionType(data.profile.sessionType || 'online');
        }
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const toggleSubject = (s) => {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (subjects.length === 0) {
      setError('Select at least one subject you can teach');
      return;
    }
    if (!hourlyRate || Number(hourlyRate) < 0) {
      setError('Enter a valid hourly rate');
      return;
    }

    setLoading(true);
    try {
      await upsertMyTutorProfile({
        bio, subjects,
        hourlyRate: Number(hourlyRate),
        yearsExperience: Number(yearsExperience) || 0,
        sessionType,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Profile</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell students about your teaching experience..."
            style={{ width: '100%', minHeight: '100px', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Subjects you can teach</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SUBJECTS.map((s) => (
              <div
                key={s}
                onClick={() => toggleSubject(s)}
                style={{
                  padding: '8px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  border: subjects.includes(s) ? '1px solid #10B981' : '1px solid var(--border)',
                  background: subjects.includes(s) ? '#ECFDF5' : 'transparent',
                  color: subjects.includes(s) ? '#047857' : 'var(--text)',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <Input id="hourlyRate" label="Hourly rate (₦)" type="number" placeholder="e.g. 3000" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
        <Input id="yearsExperience" label="Years of teaching experience" type="number" placeholder="e.g. 3" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Session type</label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem' }}
          >
            <option value="online">Online only</option>
            <option value="physical">Physical (in-person) only</option>
            <option value="both">Both online and physical</option>
          </select>
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
        {saved && <p style={{ color: '#10B981', fontSize: '0.875rem', marginBottom: '1rem' }}>Profile saved.</p>}
        <Button type="submit" loading={loading}>Save profile</Button>
      </form>
    </div>
  );
};

export default TutorProfileEdit;
