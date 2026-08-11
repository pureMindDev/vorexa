import { Component } from 'react';

// A render crash anywhere in the tree used to blank the whole app. This keeps
// the shell alive and gives the student a way out.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Vorexa crashed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          background: 'var(--bg-primary, #0B1120)',
          color: 'var(--text-primary, #F8FAFC)',
        }}
      >
        <div style={{ maxWidth: '420px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary, #94A3B8)', marginBottom: '20px' }}>
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
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
            Reload Vorexa
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
