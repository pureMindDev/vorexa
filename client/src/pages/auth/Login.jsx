import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { verifyTwoFactor } from '../../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const { login, completeLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [needsCode, setNeedsCode] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setLoading(true);
    try {
      const result = await login(form);
      if (result?.requires2FA) {
        setPendingUserId(result.userId);
        setNeedsCode(true);
      } else if (result.role === 'tutor') {
        navigate('/tutor/dashboard');
      } else if (result.role === 'parent') {
        navigate('/parent/dashboard');
      } else if (result.role === 'centre') {
        navigate('/centre/dashboard');
      } else {
        navigate(result.onboardingCompleted ? '/dashboard' : '/onboarding');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setServerError('');
    if (code.length !== 6) {
      setServerError('Enter the 6-digit code from your email');
      return;
    }
    setVerifying(true);
    try {
      const { data } = await verifyTwoFactor(pendingUserId, code);
      const user = completeLogin(data);
      if (user.role === 'tutor') {
        navigate('/tutor/dashboard');
      } else if (user.role === 'parent') {
        navigate('/parent/dashboard');
      } else if (user.role === 'centre') {
        navigate('/centre/dashboard');
      } else {
        navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'That code is invalid or has expired');
    } finally {
      setVerifying(false);
    }
  };

  if (needsCode) {
    return (
      <AuthLayout
        title="Enter your login code"
        subtitle={`We sent a 6-digit code to ${form.email}`}
        footer={
          <span>
            <Link to="#" onClick={(e) => { e.preventDefault(); setNeedsCode(false); }}>Back to login</Link>
          </span>
        }
      >
        <form onSubmit={handleVerifyCode}>
          <Input
            id="code"
            label="Login code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {serverError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{serverError}</p>}
          <Button type="submit" loading={verifying}>Verify and log in</Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue your study streak."
      footer={
        <span>
          Don't have an account? <Link to="/register">Sign up</Link>
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
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div style={{ textAlign: 'right', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#2563EB', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>
        {serverError && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{serverError}</p>}
        <Button type="submit" loading={loading}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
