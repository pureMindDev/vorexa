import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../../components/AuthLayout/AuthLayout';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import { registerUser } from '../../../services/authService';

const CentreRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Fill in your name, email, and a password of at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password, role: 'centre' });
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your centre account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Run your tutorial centre on Vorexa"
      subtitle="Manage tutors, enroll students, schedule classes, and create exams — all in one place."
      footer={
        <span>
          Already have an account? <Link to="/login">Log in</Link> &nbsp;·&nbsp; Individual tutor?{' '}
          <Link to="/tutor/register">Register as a tutor</Link>
          <br />
          <span style={{ fontSize: '0.8rem' }}>
            Student? <Link to="/register">Sign up here</Link> · Parent? <Link to="/parent/register">Register here</Link>
          </span>
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input id="name" label="Your name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="email" label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input id="password" label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
        <Button type="submit" loading={loading}>Create centre account</Button>
      </form>
    </AuthLayout>
  );
};

export default CentreRegister;
