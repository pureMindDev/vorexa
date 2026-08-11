import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { registerUser } from '../../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await registerUser(form);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your journey to acing JAMB and WAEC."
      footer={
        <span>
          Already have an account? <Link to="/login">Log in</Link>
          <br />
          <span style={{ fontSize: '0.8rem' }}>
            Tutor? <Link to="/tutor/register">Register here</Link> ·{' '}
            Parent? <Link to="/parent/register">Register here</Link> ·{' '}
            Tutorial centre? <Link to="/centre/register">Register here</Link>
          </span>
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          id="name"
          label="Full name"
          placeholder="Enter your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        {serverError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{serverError}</p>}
        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;
