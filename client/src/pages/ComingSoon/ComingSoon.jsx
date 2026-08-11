import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import Button from '../../components/Button/Button';

const ComingSoon = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const feature = searchParams.get('feature') || 'This feature';

  return (
    <div style={{ textAlign: 'center', maxWidth: '360px', margin: '4rem auto 0' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%', background: '#F5F3FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
      }}>
        <FiClock size={28} color="#7C3AED" />
      </div>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{feature} is coming soon</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        We're building this out as part of Vorexa's next phase. Focus on Learning, CBT, and your AI Tutor for now.
      </p>
      <Button style={{ width: 'auto', paddingInline: '2rem' }} onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  );
};

export default ComingSoon;
