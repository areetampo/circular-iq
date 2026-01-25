import PropTypes from 'prop-types';

export default function SessionRestorePrompt({ onRestore, onDismiss }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-dialog" style={{ maxWidth: '500px' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>🔄 Restore Previous Session</h2>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We found your previous evaluation session. Would you like to restore it?
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 0 }}>
              This includes your problem description, solution, and parameter settings.
            </p>
          </div>
          <div
            className="modal-footer"
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              padding: '1rem 1.5rem',
            }}
          >
            <button
              className="modal-cancel-button"
              onClick={onDismiss}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.95rem',
                border: '1px solid #ddd',
                background: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Start Fresh
            </button>
            <button
              className="modal-save-button"
              onClick={onRestore}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.95rem',
                background: '#34a83a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Restore Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

SessionRestorePrompt.propTypes = {
  onRestore: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
