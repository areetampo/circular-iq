export default function EvaluationCriteriaModal({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #eee',
          }}
        >
          <h2 style={{ margin: 0, color: '#34a83a' }}>Evaluation Criteria</h2>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.background = '#f5f5f5';
              e.target.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#999';
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Our AI-powered evaluation framework assesses business ideas across three core value
            dimensions, each comprising specific factors.
          </p>

          {/* Key Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                background: '#e3f2fd',
                padding: '1.5rem',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4a90e2' }}>3</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Core Value Types</div>
            </div>
            <div
              style={{
                background: '#e8f5e9',
                padding: '1.5rem',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34a83a' }}>8</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Evaluation Factors</div>
            </div>
            <div
              style={{
                background: '#e8f5e9',
                padding: '1.5rem',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34a83a' }}>100</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Maximum Score</div>
            </div>
          </div>

          {/* Access Value Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>🔗</div>
              <div>
                <h3 style={{ margin: 0, color: '#4a90e2' }}>Access Value</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Evaluates accessibility and participation aspects
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4a90e2',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Public Participation</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Measures how easily stakeholders, communities, and end-users can engage with and
                  contribute to the circular system.
                </p>
              </div>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4a90e2',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                  Infrastructure & Accessibility
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Assesses the availability of necessary infrastructure and ease of access to
                  circular economy resources and processes.
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Value Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>💰</div>
              <div>
                <h3 style={{ margin: 0, color: '#34a83a' }}>Embedded Value</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Evaluates inherent and economic value of resources
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #34a83a',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Market Price</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Evaluates the economic value and market demand for recovered or repurposed
                  materials.
                </p>
              </div>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #34a83a',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Maintenance</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Assesses the ease and cost of maintaining products, materials, or systems
                  throughout their lifecycle.
                </p>
              </div>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #34a83a',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Uniqueness</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Measures the rarity, specialty, or distinctive value of materials and their
                  potential for reuse.
                </p>
              </div>
            </div>
          </div>

          {/* Processing Value Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>⚙️</div>
              <div>
                <h3 style={{ margin: 0, color: '#26a69a' }}>Processing Value</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Evaluates technical and operational factors
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #26a69a',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Size</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Considers the physical dimensions and volume, affecting handling, storage, and
                  transportation efficiency.
                </p>
              </div>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #26a69a',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Chemical Toxicity</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Assesses potential environmental and health hazards, impacting safe processing and
                  disposal methods.
                </p>
              </div>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  borderLeft: '4px solid #26a69a',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Technology Needed</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                  Evaluates the complexity and availability of technology required for effective
                  processing and recovery.
                </p>
              </div>
            </div>
          </div>

          {/* How We Calculate Section */}
          <div style={{ background: '#f0f4f8', padding: '1.5rem', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>How We Calculate Your Score</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    background: '#34a83a',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 'bold',
                  }}
                >
                  1
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#2c3e50' }}>AI Analysis</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                    Our machine learning model analyzes your business description against each of
                    the 8 factors
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    background: '#34a83a',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 'bold',
                  }}
                >
                  2
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#2c3e50' }}>Weighted Scoring</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                    Each value type contributes proportionally to the overall circularity score
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    background: '#34a83a',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 'bold',
                  }}
                >
                  3
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#2c3e50' }}>
                    Comprehensive Report
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                    Receive detailed insights, strengths, and actionable recommendations for
                    improvement
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
