import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import Button from '../../components/Button/Button';
import { verifyEmail, resendVerification } from '../../services/authService';

const CODE_LENGTH = 6;

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // only allow a single digit
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split('');
    while (next.length < CODE_LENGTH) next.push('');
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Enter the full 6-digit code');
      return;
    }
    if (!email) {
      setError('Missing email — please go back and register or log in again');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email, code);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'That code is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await resendVerification(email);
      setResent(true);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        email
          ? `Enter the 6-digit code we sent to ${email}`
          : 'Enter the 6-digit code we sent to your email'
      }
      footer={
        <span>
          Wrong email? <Link to="/register">Go back</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', justifyContent: 'space-between' }}
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: '48px',
                height: '56px',
                textAlign: 'center',
                fontSize: '1.25rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
          ))}
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        <Button type="submit" loading={loading}>
          Verify email
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        <Button variant="outline" onClick={handleResend} loading={resending} disabled={resent}>
          {resent ? 'Code sent' : 'Resend code'}
        </Button>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
