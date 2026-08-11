import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../../components/AuthLayout/AuthLayout';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import { registerTutor } from '../../../services/authService';

const SUBJECTS = ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Government', 'Economics', 'Geography', 'Commerce'];

const TutorRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [sessionType, setSessionType] = useState('online');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSubject = (s) => {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Fill in your name, email, and a password of at least 6 characters');
      return;
    }
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
      await registerTutor({
        name, email, password, bio, subjects,
        hourlyRate: Number(hourlyRate),
        yearsExperience: Number(yearsExperience) || 0,
        sessionType,
      });
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your tutor account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Become a Vorexa tutor"
      subtitle="Create your tutor account to start receiving bookings."
      footer={
        <span>
          Already a tutor? <Link to="/login">Log in</Link> &nbsp;·&nbsp; Student? <Link to="/register">Sign up here</Link>
          <br />
          <span style={{ fontSize: '0.8rem' }}>
            Parent? <Link to="/parent/register">Register here</Link> ·{' '}
            Tutorial centre? <Link to="/centre/register">Register here</Link>
          </span>
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input id="name" label="Full name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="email" label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input id="password" label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell students about your teaching experience..."
            style={{ width: '100%', minHeight: '80px', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }}
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
        <Button type="submit" loading={loading}>Create tutor account</Button>
      </form>
    </AuthLayout>
  );
};

export default TutorRegister;
