import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { verifyPayment } from '../../services/paymentService';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [amount, setAmount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!reference) {
        setStatus('failed');
        setError('No payment reference found in the URL.');
        return;
      }
      try {
        const { data } = await verifyPayment(reference);
        setStatus(data.status);
        setAmount(data.amount);
      } catch (err) {
        setStatus('failed');
        setError(err.response?.data?.message || 'Could not verify this payment.');
      }
    };
    run();
  }, [reference]);

  return (
    <div style={{ textAlign: 'center', maxWidth: '360px', margin: '4rem auto 0' }}>
      {status === 'verifying' && <p style={{ color: 'var(--text-secondary)' }}>Verifying your payment...</p>}

      {status === 'success' && (
        <>
          <FiCheckCircle size={40} color="#10B981" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Payment successful</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {amount ? `₦${amount.toLocaleString()} paid. ` : ''}Your tutor has been notified.
          </p>
        </>
      )}

      {status === 'failed' && (
        <>
          <FiXCircle size={40} color="#EF4444" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Payment not completed</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {error || 'The payment was not successful. You can try again from your bookings.'}
          </p>
        </>
      )}

      {status !== 'verifying' && (
        <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/bookings')}>
          &larr; Back to my bookings
        </span>
      )}
    </div>
  );
};

export default PaymentCallback;
