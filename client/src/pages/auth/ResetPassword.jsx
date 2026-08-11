import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { resetPassword } from '../../services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Reset token is missing from the link');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      footer={
        <span>
          <Link to="/login">Back to login</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          id="password"
          label="New password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          id="confirm"
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
        <Button type="submit" loading={loading}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
