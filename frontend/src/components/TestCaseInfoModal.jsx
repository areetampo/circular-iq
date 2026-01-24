export default function TestCaseInfoModal({ onClose, testCase }) {
  // If testCase is provided, show individual test case details
  // Otherwise show general info about test cases
  if (testCase) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '700px' }}
        >
          <div className="modal-header">
            <h2>{testCase.title}</h2>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#2c3e50', marginBottom: '0.75rem' }}>
                Business Problem
              </h3>
              <p
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '6px',
                  lineHeight: '1.7',
                  fontSize: '0.95rem',
                  color: '#495057',
                }}
              >
                {testCase.problem}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#2c3e50', marginBottom: '0.75rem' }}>
                Business Solution
              </h3>
              <p
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '6px',
                  lineHeight: '1.7',
                  fontSize: '0.95rem',
                  color: '#495057',
                }}
              >
                {testCase.solution}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', color: '#2c3e50', marginBottom: '0.75rem' }}>
                Parameter Scores
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {Object.entries(testCase.parameters).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      background: value >= 75 ? '#d4edda' : value >= 50 ? '#fff3cd' : '#f8d7da',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: `1px solid ${value >= 75 ? '#c3e6cb' : value >= 50 ? '#ffeaa7' : '#f5c6cb'}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        color: value >= 75 ? '#155724' : value >= 50 ? '#856404' : '#721c24',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: value >= 75 ? '#155724' : value >= 50 ? '#856404' : '#721c24',
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="modal-cancel-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // General info modal
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <h2>About Test Cases</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ fontSize: '0.95rem', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '1.25rem' }}>
            <strong>Test cases are pre-filled example submissions</strong> that demonstrate how to
            describe circular economy business ideas effectively.
          </p>

          <h3
            style={{
              fontSize: '1rem',
              marginTop: '1.25rem',
              marginBottom: '0.75rem',
              color: '#2c3e50',
            }}
          >
            How to Use Them:
          </h3>
          <ul style={{ marginLeft: '1.25rem', marginBottom: '1.25rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Click any test case card to auto-populate the form
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Click the <strong>ⓘ</strong> button on a card to preview its details
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Observe well-structured problems and solutions
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              See example parameter scores for different strategies
            </li>
          </ul>

          <div
            style={{
              background: '#e8f5e9',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #c3e6cb',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#155724' }}>
              <strong>💡 Tip:</strong> All test cases represent real circular economy business
              models and are great templates for understanding what makes a strong submission.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel-button" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
