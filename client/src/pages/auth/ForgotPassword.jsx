import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { forgotPassword } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <span>
          Remembered it? <Link to="/login">Log in</Link>
        </span>
      }
    >
      {sent ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          If an account exists for <strong style={{ color: 'var(--text)' }}>{email}</strong>, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
