export default function AssessmentMethodologyModal({ onClose }) {
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
          <h2 style={{ margin: 0, color: '#34a83a' }}>Assessment Methodology</h2>
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
            This evaluation uses a proprietary AI-powered framework combining vector similarity
            search with GPT-4o-mini reasoning against a database of 1,108 high-quality circular
            economy projects.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                background: '#f8f9fa',
                padding: '1.25rem',
                borderRadius: '10px',
                borderLeft: '4px solid #4a90e2',
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#2c3e50', fontSize: '1rem' }}>
                🔍 Semantic Analysis
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant
                projects matching your business model and problem space.
              </p>
            </div>

            <div
              style={{
                background: '#f8f9fa',
                padding: '1.25rem',
                borderRadius: '10px',
                borderLeft: '4px solid #34a83a',
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#2c3e50', fontSize: '1rem' }}>
                🤖 AI Reasoning
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                GPT-4o-mini analyzes your submission against 3 similar cases with strict
                evidence-based reasoning and integrity checking.
              </p>
            </div>

            <div
              style={{
                background: '#f8f9fa',
                padding: '1.25rem',
                borderRadius: '10px',
                borderLeft: '4px solid #ff9800',
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#2c3e50', fontSize: '1rem' }}>
                📊 Multi-Dimensional Scoring
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                Evaluates across 8 weighted parameters covering material innovation, circularity
                loops, market viability, and environmental impact.
              </p>
            </div>

            <div
              style={{
                background: '#f8f9fa',
                padding: '1.25rem',
                borderRadius: '10px',
                borderLeft: '4px solid #9c27b0',
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#2c3e50', fontSize: '1rem' }}>
                ✓ Integrity Validation
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                Cross-references your self-assessed scores against real-world benchmarks to identify
                overestimations and provide honest feedback.
              </p>
            </div>
          </div>

          <div
            style={{
              background: '#e8f5e9',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '2px solid #34a83a',
              marginBottom: '1.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#2d5f2e', fontSize: '1rem' }}>
              📚 Data Source
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2d5f2e', lineHeight: '1.6' }}>
              <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection of
              1,108 high-quality circular economy solutions (filtered from 1,300) spanning waste
              reduction, resource optimization, renewable energy, sustainable materials, and
              regenerative agriculture across multiple industries and geographic regions.
            </p>
          </div>

          <div
            style={{
              padding: '1rem',
              background: '#fff3e0',
              borderRadius: '8px',
              borderLeft: '4px solid #ff9800',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#e65100', lineHeight: '1.6' }}>
              <strong>⚠️ Disclaimer:</strong> This assessment is designed to provide constructive
              feedback for early-stage ideation. Scores reflect alignment with established circular
              economy principles and should be used as guidance, not as definitive validation of
              commercial viability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
