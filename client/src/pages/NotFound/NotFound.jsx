import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ maxWidth: '420px' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '4px' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Page not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          That page doesn't exist, or it moved somewhere else.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#2563EB',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
