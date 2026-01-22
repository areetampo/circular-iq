export default function EvaluationCriteriaView({ onBack }) {
  return (
    <div className="app-container">
      <div className="criteria-view">
        {/* Header */}
        <div className="header-section">
          <div className="criteria-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" fill="#34a83a" />
              <path
                d="M8 8 L16 8 M8 12 L16 12 M8 16 L12 16"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="main-title">Evaluation Criteria</h1>
          <p className="subtitle">
            Our AI-powered evaluation framework assesses business ideas across three core value
            dimensions, each comprising specific factors.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="metrics-cards">
          <div className="metric-card blue">
            <div className="metric-number">3</div>
            <div className="metric-label">Core Value Types</div>
          </div>
          <div className="metric-card green">
            <div className="metric-number">8</div>
            <div className="metric-label">Evaluation Factors</div>
          </div>
          <div className="metric-card green">
            <div className="metric-number">100</div>
            <div className="metric-label">Maximum Score</div>
          </div>
        </div>

        {/* Access Value Section */}
        <div className="value-section access-value">
          <div className="value-header">
            <div className="value-icon blue-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="12" r="3" stroke="#4a90e2" strokeWidth="2" />
                <circle cx="16" cy="12" r="3" stroke="#4a90e2" strokeWidth="2" />
                <path d="M11 12 L13 12" stroke="#4a90e2" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2>Access Value</h2>
              <p className="value-description">Evaluates accessibility and participation aspects</p>
            </div>
          </div>
          <div className="factors-grid">
            <div className="factor-card">
              <div className="factor-icon blue-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                    stroke="#4a90e2"
                    strokeWidth="2"
                  />
                  <circle cx="9" cy="9" r="2" fill="#4a90e2" />
                  <path d="M16 12 L20 12" stroke="#4a90e2" strokeWidth="2" />
                </svg>
              </div>
              <h3>Public Participation</h3>
              <p>
                Measures how easily stakeholders, communities, and end-users can engage with and
                contribute to the circular system.
              </p>
            </div>
            <div className="factor-card">
              <div className="factor-icon blue-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="#4a90e2" strokeWidth="2" />
                  <path
                    d="M12 4 L12 8 M12 16 L12 20 M4 12 L8 12 M16 12 L20 12"
                    stroke="#4a90e2"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3>Infrastructure & Accessibility</h3>
              <p>
                Assesses the availability of necessary infrastructure and ease of access to circular
                economy resources and processes.
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Value Section */}
        <div className="value-section embedded-value">
          <div className="value-header">
            <div className="value-icon green-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <text
                  x="12"
                  y="18"
                  textAnchor="middle"
                  fontSize="20"
                  fill="#34a83a"
                  fontWeight="bold"
                >
                  $
                </text>
              </svg>
            </div>
            <div>
              <h2>Embedded Value</h2>
              <p className="value-description">
                Evaluates inherent and economic value of resources
              </p>
            </div>
          </div>
          <div className="factors-grid">
            <div className="factor-card">
              <div className="factor-icon green-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="8" width="12" height="8" rx="1" stroke="#34a83a" strokeWidth="2" />
                  <path d="M9 8 L9 6 L15 6 L15 8" stroke="#34a83a" strokeWidth="2" />
                  <path d="M10 12 L14 12" stroke="#34a83a" strokeWidth="2" />
                </svg>
              </div>
              <h3>Market Price</h3>
              <p>
                Evaluates the economic value and market demand for recovered or repurposed
                materials.
              </p>
            </div>
            <div className="factor-card">
              <div className="factor-icon green-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z"
                    stroke="#34a83a"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <h3>Maintenance</h3>
              <p>
                Assesses the ease and cost of maintaining products, materials, or systems throughout
                their lifecycle.
              </p>
            </div>
            <div className="factor-card">
              <div className="factor-icon green-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z"
                    stroke="#34a83a"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <h3>Uniqueness</h3>
              <p>
                Measures the rarity, specialty, or distinctive value of materials and their
                potential for reuse.
              </p>
            </div>
          </div>
        </div>

        {/* Processing Value Section */}
        <div className="value-section processing-value">
          <div className="value-header">
            <div className="value-icon teal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="#26a69a" strokeWidth="2" />
                <circle cx="9" cy="9" r="2" fill="#26a69a" />
                <circle cx="15" cy="15" r="2" fill="#26a69a" />
                <path d="M11 9 L13 15" stroke="#26a69a" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h2>Processing Value</h2>
              <p className="value-description">Evaluates technical and operational factors</p>
            </div>
          </div>
          <div className="factors-grid">
            <div className="factor-card">
              <div className="factor-icon teal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12 L20 12" stroke="#26a69a" strokeWidth="2" />
                  <path d="M12 4 L12 20" stroke="#26a69a" strokeWidth="2" />
                  <circle cx="4" cy="12" r="2" fill="#26a69a" />
                  <circle cx="20" cy="12" r="2" fill="#26a69a" />
                </svg>
              </div>
              <h3>Size</h3>
              <p>
                Considers the physical dimensions and volume, affecting handling, storage, and
                transportation efficiency.
              </p>
            </div>
            <div className="factor-card">
              <div className="factor-icon teal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2 L2 7 L12 12 L22 7 Z M2 17 L12 22 L22 17 M2 12 L12 17 L22 12"
                    stroke="#26a69a"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <h3>Chemical Toxicity</h3>
              <p>
                Assesses potential environmental and health hazards, impacting safe processing and
                disposal methods.
              </p>
            </div>
            <div className="factor-card">
              <div className="factor-icon teal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                    stroke="#26a69a"
                    strokeWidth="2"
                  />
                  <circle cx="9" cy="9" r="1" fill="#26a69a" />
                  <circle cx="15" cy="9" r="1" fill="#26a69a" />
                  <circle cx="9" cy="15" r="1" fill="#26a69a" />
                  <circle cx="15" cy="15" r="1" fill="#26a69a" />
                </svg>
              </div>
              <h3>Technology Needed</h3>
              <p>
                Evaluates the complexity and availability of technology required for effective
                processing and recovery.
              </p>
            </div>
          </div>
        </div>

        {/* How We Calculate Section */}
        <div className="calculation-section">
          <h2>How We Calculate Your Score</h2>
          <div className="calculation-steps">
            <div className="calculation-step">
              <div className="step-number">1</div>
              <div>
                <h3>AI Analysis</h3>
                <p>
                  Our machine learning model analyzes your business description against each of the
                  8 factors
                </p>
              </div>
            </div>
            <div className="calculation-step">
              <div className="step-number">2</div>
              <div>
                <h3>Weighted Scoring</h3>
                <p>Each value type contributes proportionally to the overall circularity score</p>
              </div>
            </div>
            <div className="calculation-step">
              <div className="step-number">3</div>
              <div>
                <h3>Comprehensive Report</h3>
                <p>
                  Receive detailed insights, strengths, and actionable recommendations for
                  improvement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="criteria-footer">
          <button className="back-link" onClick={onBack}>
            ← Back to Evaluation
          </button>
        </div>
      </div>
    </div>
  );
}
