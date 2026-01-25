import { useNavigate } from 'react-router-dom';

export default function NotFoundView() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div
        style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#34a83a',
              opacity: 0.3,
            }}
          >
            404
          </div>
        </div>

        <h1 style={{ fontSize: '2rem', color: '#2c3e50', margin: '0 0 1rem 0' }}>Page Not Found</h1>

        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem', maxWidth: '500px' }}>
          The page you're looking for doesn't exist. It may have been moved or deleted.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#34a83a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#2a8a2f')}
            onMouseLeave={(e) => (e.target.style.background = '#34a83a')}
          >
            ← Return Home
          </button>
          <button
            onClick={() => navigate('/assessments')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4a90e2',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#357abd')}
            onMouseLeave={(e) => (e.target.style.background = '#4a90e2')}
          >
            📈 My Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
