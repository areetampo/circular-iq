import { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

// View states
const VIEWS = {
  LANDING: 'landing',
  RESULTS: 'results',
  CRITERIA: 'criteria',
};

export default function App() {
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState(VIEWS.LANDING);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 8 evaluation parameters - all initialized to 50
  const [parameters, setParameters] = useState({
    public_participation: 50,
    infrastructure: 50,
    market_price: 50,
    maintenance: 50,
    uniqueness: 50,
    size_efficiency: 50,
    chemical_safety: 50,
    tech_readiness: 50,
  });

  async function submit() {
    if (!idea.trim() || idea.trim().length < 50) {
      setError('Please provide at least 50 characters for accurate analysis.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          parameters,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API error');
      }

      const data = await res.json();
      console.log('Full API Response:', data);
      console.log('Overall Score:', data.overall_score);
      console.log('Sub Scores:', data.sub_scores);
      console.log('Sub Scores Keys:', Object.keys(data.sub_scores || {}));

      // Handle junk input case
      if (data.audit?.is_junk_input) {
        setError(
          data.audit.audit_verdict ||
            'Input was too vague to analyze. Please provide more details.',
        );
        setLoading(false);
        return;
      }

      setResult(data);
      setCurrentView(VIEWS.RESULTS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Define the 8 valid keys
  const validKeys = [
    'public_participation',
    'infrastructure',
    'market_price',
    'maintenance',
    'uniqueness',
    'size_efficiency',
    'chemical_safety',
    'tech_readiness',
  ];

  // Map sub_scores to category names for display
  const categoryMapping = {
    public_participation: {
      name: 'Public Participation',
      desc: 'How easily stakeholders, communities, and end-users can engage with and contribute to the circular system',
    },
    infrastructure: {
      name: 'Infrastructure & Accessibility',
      desc: 'Availability of necessary infrastructure and ease of access to circular economy resources and processes',
    },
    market_price: {
      name: 'Market Price',
      desc: 'Economic value and market demand for recovered or repurposed materials',
    },
    maintenance: {
      name: 'Maintenance',
      desc: 'Ease and cost of maintaining products, materials, or systems throughout their lifecycle',
    },
    uniqueness: {
      name: 'Uniqueness',
      desc: 'Rarity, specialty, or distinctive value of materials and their potential for reuse',
    },
    size_efficiency: {
      name: 'Size Efficiency',
      desc: 'Physical dimensions and volume, affecting handling, storage, and transportation efficiency',
    },
    chemical_safety: {
      name: 'Chemical Safety',
      desc: 'Potential environmental and health hazards, impacting safe processing and disposal methods',
    },
    tech_readiness: {
      name: 'Tech Readiness',
      desc: 'Complexity and availability of technology required for effective processing and recovery',
    },
  };

  // Calculate market average from similar_cases similarity scores
  const calculateMarketAvg = () => {
    if (!result?.similar_cases || result.similar_cases.length === 0) {
      return 65; // Default fallback
    }
    return (
      result.similar_cases.reduce((acc, curr) => acc + (curr.similarity || 0) * 100, 0) /
      result.similar_cases.length
    );
  };

  const marketAvg = calculateMarketAvg();

  // Prepare radar chart data using sub_scores from response
  // Ensure we only use the 8 valid keys and handle null values
  const radarData = result?.sub_scores
    ? validKeys
        .filter((key) => key in (result.sub_scores || {}))
        .map((key) => {
          const value = result.sub_scores[key];
          // Handle null, undefined, or invalid values - default to 0
          const numValue = value != null && !isNaN(value) ? Number(value) : 0;
          return {
            subject: categoryMapping[key]?.name || key.replace(/_/g, ' '),
            userValue: numValue,
            marketAvg: marketAvg,
          };
        })
    : [];

  // Calculate business viability score (derived from overall score and confidence)
  const businessViabilityScore = result
    ? Math.round(
        result.overall_score * 0.7 +
          (result.audit?.confidence_score <= 1
            ? result.audit.confidence_score * 100
            : result.audit?.confidence_score || 0) *
            0.3,
      )
    : 0;

  // Get rating badge text
  const getRatingBadge = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Render based on current view
  if (currentView === VIEWS.CRITERIA) {
    return <EvaluationCriteriaView onBack={() => setCurrentView(VIEWS.RESULTS)} />;
  }

  if (currentView === VIEWS.RESULTS && result) {
    return (
      <ResultsView
        result={result}
        radarData={radarData}
        categoryMapping={categoryMapping}
        validKeys={validKeys}
        businessViabilityScore={businessViabilityScore}
        getRatingBadge={getRatingBadge}
        onBack={() => {
          setCurrentView(VIEWS.LANDING);
          setResult(null);
          setIdea('');
        }}
        onViewCriteria={() => setCurrentView(VIEWS.CRITERIA)}
      />
    );
  }

  return (
    <LandingView
      idea={idea}
      setIdea={setIdea}
      parameters={parameters}
      setParameters={setParameters}
      showAdvanced={showAdvanced}
      setShowAdvanced={setShowAdvanced}
      onSubmit={submit}
      loading={loading}
      error={error}
      showInfoIcons={!result}
    />
  );
}

// Info Modal Component
function InfoModal({ onClose, type }) {
  const factorDefinitions = {
    public_participation: {
      title: 'Public Participation',
      desc: 'Measures how easily stakeholders, communities, and end-users can engage with and contribute to the circular system. Higher scores indicate better accessibility for public involvement.',
      category: 'Access Value',
    },
    infrastructure: {
      title: 'Infrastructure & Accessibility',
      desc: 'Assesses the availability of necessary infrastructure and ease of access to circular economy resources and processes. Considers physical, digital, and logistical infrastructure.',
      category: 'Access Value',
    },
    market_price: {
      title: 'Market Price',
      desc: 'Evaluates the economic value and market demand for recovered or repurposed materials. Higher scores indicate stronger market viability and revenue potential.',
      category: 'Embedded Value',
    },
    maintenance: {
      title: 'Maintenance',
      desc: 'Assesses the ease and cost of maintaining products, materials, or systems throughout their lifecycle. Lower maintenance complexity scores higher.',
      category: 'Embedded Value',
    },
    uniqueness: {
      title: 'Uniqueness',
      desc: 'Measures the rarity, specialty, or distinctive value of materials and their potential for reuse. Unique materials often have higher circular economy potential.',
      category: 'Embedded Value',
    },
    size_efficiency: {
      title: 'Size Efficiency',
      desc: 'Considers the physical dimensions and volume, affecting handling, storage, and transportation efficiency. Compact designs score higher.',
      category: 'Processing Value',
    },
    chemical_safety: {
      title: 'Chemical Safety',
      desc: 'Assesses potential environmental and health hazards, impacting safe processing and disposal methods. Non-toxic materials score higher.',
      category: 'Processing Value',
    },
    tech_readiness: {
      title: 'Technology Readiness',
      desc: 'Evaluates the complexity and availability of technology required for effective processing and recovery. Readily available technology scores higher.',
      category: 'Processing Value',
    },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{type === 'description' ? 'Business Description Guide' : 'Evaluation Factors'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {type === 'description' ? (
            <div>
              <p style={{ marginBottom: '16px' }}>
                Provide a detailed description of your circular economy business idea. Include:
              </p>
              <ul style={{ paddingLeft: '24px', lineHeight: '1.8' }}>
                <li>
                  <strong>Materials:</strong> What materials or resources are being reused,
                  recycled, or recovered?
                </li>
                <li>
                  <strong>Process:</strong> How does your business model close the loop?
                </li>
                <li>
                  <strong>Stakeholders:</strong> Who are the key participants (suppliers, customers,
                  partners)?
                </li>
                <li>
                  <strong>Value Proposition:</strong> What environmental and economic benefits does
                  it provide?
                </li>
                <li>
                  <strong>Scale:</strong> What is the intended scope (local, regional, global)?
                </li>
              </ul>
              <p style={{ marginTop: '16px', fontStyle: 'italic', color: '#666' }}>
                A minimum of 50 characters is required for accurate AI analysis.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '20px' }}>
                Our evaluation framework assesses your business across 8 key factors grouped into 3
                value categories:
              </p>
              {Object.entries(factorDefinitions).map(([key, factor]) => (
                <div
                  key={key}
                  style={{
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <h3 style={{ margin: 0, color: '#34a83a' }}>{factor.title}</h3>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        backgroundColor: '#f5f5f5',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {factor.category}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#555', lineHeight: '1.6' }}>{factor.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Context Modal Component for Database Evidence
function ContextModal({ onClose, content, title }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title || 'Full Context'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p style={{ lineHeight: '1.8', color: '#333' }}>{content}</p>
        </div>
      </div>
    </div>
  );
}

// Landing View Component (l1.png)
function LandingView({
  idea,
  setIdea,
  parameters,
  setParameters,
  showAdvanced,
  setShowAdvanced,
  onSubmit,
  loading,
  error,
  showInfoIcons,
}) {
  const [showInfoModal, setShowInfoModal] = useState(null);

  const parameterLabels = {
    public_participation: { label: 'Public Participation', category: 'Access Value' },
    infrastructure: { label: 'Infrastructure & Accessibility', category: 'Access Value' },
    market_price: { label: 'Market Price', category: 'Embedded Value' },
    maintenance: { label: 'Maintenance', category: 'Embedded Value' },
    uniqueness: { label: 'Uniqueness', category: 'Embedded Value' },
    size_efficiency: { label: 'Size Efficiency', category: 'Processing Value' },
    chemical_safety: { label: 'Chemical Safety', category: 'Processing Value' },
    tech_readiness: { label: 'Tech Readiness', category: 'Processing Value' },
  };

  const handleParameterChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: parseInt(value, 10),
    }));
  };

  return (
    <div className="app-container">
      <div className="landing-view">
        {/* Header */}
        <div className="header-section">
          <div className="logo-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#34a83a" strokeWidth="3" fill="none" />
              <path
                d="M32 4 L32 20 M32 44 L32 60 M4 32 L20 32 M44 32 L60 32"
                stroke="#34a83a"
                strokeWidth="2"
              />
              <path
                d="M20 20 Q32 28 44 20 M20 44 Q32 36 44 44"
                stroke="#34a83a"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="main-title">Circular Economy Business Evaluator</h1>
          <p className="subtitle">
            Evaluate your business idea's circularity potential using AI-driven analysis
          </p>
        </div>

        {/* Feature Cards */}
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#fff4e6' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2" />
                <path
                  d="M12 6 L12 12 L16 14"
                  stroke="#ff9800"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>AI-Powered</h3>
            <p>Machine learning analysis based on circular economy principles</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#e3f2fd' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
                <rect x="13" y="3" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
                <rect x="3" y="13" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
                <rect x="13" y="13" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
              </svg>
            </div>
            <h3>Multi-Dimensional</h3>
            <p>Evaluates across 5 key circular economy domains</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#e8f5e9' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12 L10 17 L20 7"
                  stroke="#4caf50"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Actionable</h3>
            <p>Receive specific recommendations for improvement</p>
          </div>
        </div>

        {/* Input Form */}
        <div className="input-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <h2 style={{ margin: 0 }}>Describe Your Business Idea</h2>
            {showInfoIcons && (
              <button
                className="info-icon-btn"
                onClick={() => setShowInfoModal('description')}
                title="Help with business description"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#34a83a" strokeWidth="2" />
                  <path
                    d="M12 16v-4M12 8h.01"
                    stroke="#34a83a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className="input-instructions">
            Provide details about your circular economy business concept. Include information about
            materials, processes, waste management, and sustainability goals.
          </p>
          <textarea
            className="idea-textarea"
            rows="8"
            placeholder="Example: A platform that connects restaurants with surplus food to local food banks and composting facilities, using AI to optimize collection routes and predict food waste patterns..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading}
          />
          <div className="char-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#999" strokeWidth="2" />
              <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#999">
                i
              </text>
            </svg>
            Minimum 50 characters recommended for accurate analysis.
          </div>
          {error && <div className="error-message">{error}</div>}

          {/* Advanced Parameters Section */}
          <div className="advanced-parameters">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '▼' : '▶'} Advanced Parameters
              </button>
              {showInfoIcons && (
                <button
                  className="info-icon-btn"
                  onClick={() => setShowInfoModal('factors')}
                  title="Learn about evaluation factors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#34a83a" strokeWidth="2" />
                    <path
                      d="M12 16v-4M12 8h.01"
                      stroke="#34a83a"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            {showAdvanced && (
              <div className="parameters-grid">
                {/* Access Value */}
                <div className="parameter-group">
                  <h3 className="parameter-group-title">Access Value</h3>
                  {['public_participation', 'infrastructure'].map((key) => (
                    <div key={key} className="parameter-item">
                      <div className="parameter-label-row">
                        <label htmlFor={key}>{parameterLabels[key].label}</label>
                        <span className="parameter-value">{parameters[key]}</span>
                      </div>
                      <input
                        type="range"
                        id={key}
                        min="0"
                        max="100"
                        value={parameters[key]}
                        onChange={(e) => handleParameterChange(key, e.target.value)}
                        className="parameter-slider"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>

                {/* Embedded Value */}
                <div className="parameter-group">
                  <h3 className="parameter-group-title">Embedded Value</h3>
                  {['market_price', 'maintenance', 'uniqueness'].map((key) => (
                    <div key={key} className="parameter-item">
                      <div className="parameter-label-row">
                        <label htmlFor={key}>{parameterLabels[key].label}</label>
                        <span className="parameter-value">{parameters[key]}</span>
                      </div>
                      <input
                        type="range"
                        id={key}
                        min="0"
                        max="100"
                        value={parameters[key]}
                        onChange={(e) => handleParameterChange(key, e.target.value)}
                        className="parameter-slider"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>

                {/* Processing Value */}
                <div className="parameter-group">
                  <h3 className="parameter-group-title">Processing Value</h3>
                  {['size_efficiency', 'chemical_safety', 'tech_readiness'].map((key) => (
                    <div key={key} className="parameter-item">
                      <div className="parameter-label-row">
                        <label htmlFor={key}>{parameterLabels[key].label}</label>
                        <span className="parameter-value">{parameters[key]}</span>
                      </div>
                      <input
                        type="range"
                        id={key}
                        min="0"
                        max="100"
                        value={parameters[key]}
                        onChange={(e) => handleParameterChange(key, e.target.value)}
                        className="parameter-slider"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="submit-button" onClick={onSubmit} disabled={loading || !idea.trim()}>
            {loading ? (
              <span className="loading-spinner">
                <span></span>
                <span></span>
                <span></span>
              </span>
            ) : (
              <>
                Evaluate Circularity <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="footer-disclaimer">
          Based on research synthesis of AI applications in circular economy domains.
        </p>
      </div>

      {/* Info Modals */}
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(null)} type={showInfoModal} />}

      <style jsx>{`
        .info-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .info-icon-btn:hover {
          transform: scale(1.1);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #eee;
        }
        .modal-header h2 {
          margin: 0;
          color: #34a83a;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }
        .modal-body {
          padding: 24px;
        }
      `}</style>
    </div>
  );
}

// Results View Component (l2.png)
function ResultsView({
  result,
  radarData,
  categoryMapping,
  validKeys,
  businessViabilityScore,
  getRatingBadge,
  onBack,
  onViewCriteria,
}) {
  const [contextModal, setContextModal] = useState(null);

  // Ensure overall_score is a valid number
  const overallScore = result?.overall_score != null ? Number(result.overall_score) : 0;
  const rating = getRatingBadge(overallScore);

  // Separate integrity gaps into strengths and gaps
  const integrityGaps = result.audit?.integrity_gaps || [];
  const strengths = integrityGaps.filter((gap) => {
    const issue = gap.issue || gap;
    return !issue.toLowerCase().includes('gap') && !issue.toLowerCase().includes('missing');
  });
  const gaps = integrityGaps.filter((gap) => {
    const issue = gap.issue || gap;
    return issue.toLowerCase().includes('gap') || issue.toLowerCase().includes('missing');
  });

  // If no explicit gaps, treat all as potential strengths or show positive aspects
  const displayStrengths = strengths.length > 0 ? strengths : [];
  const displayGaps = gaps.length > 0 ? gaps : [];

  // Get similar cases summaries from audit
  const casesSummaries = result.audit?.similar_cases_summaries || [];

  return (
    <div className="app-container">
      <div className="results-view">
        {/* Header */}
        <div className="header-section">
          <div className="logo-icon">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#34a83a" strokeWidth="3" fill="none" />
              <path
                d="M32 4 L32 20 M32 44 L32 60 M4 32 L20 32 M44 32 L60 32"
                stroke="#34a83a"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h1 className="main-title">Circularity Assessment Results</h1>
          <p className="subtitle">AI-powered evaluation of your business idea</p>
        </div>

        {/* Audit Verdict - Prominent at top */}
        {result.audit?.audit_verdict && (
          <div className="verdict-card prominent">
            <h2>Auditor's Verdict</h2>
            <p className="verdict-text">{result.audit.audit_verdict}</p>
          </div>
        )}

        {/* Overall Score Card */}
        <div className="score-card">
          <h2>Overall Circularity Score</h2>
          <p className="score-description">
            Based on multi-dimensional analysis across key circular economy domains
          </p>
          <div className="score-display">
            <div className="rating-badge">{rating}</div>
            <div className="score-value">
              <span className="score-number">{overallScore}</span>
              <span className="score-out-of">out of 100</span>
            </div>
          </div>
          <div className="score-progress-bar">
            <div className="score-progress-fill" style={{ width: `${overallScore}%` }}></div>
          </div>
        </div>

        {/* Category Analysis */}
        <div className="category-card">
          <h2>Category Analysis</h2>
          {validKeys.map((key) => {
            const value = result.sub_scores?.[key];
            // Skip if key doesn't exist in sub_scores
            if (!(result.sub_scores && key in result.sub_scores)) return null;

            const category = categoryMapping[key];
            if (!category) return null;

            // Handle null, undefined, or invalid values - default to 0
            const numValue = value != null && !isNaN(value) ? Number(value) : 0;

            return (
              <div key={key} className="category-item">
                <div className="category-header">
                  <div>
                    <h3>{category.name}</h3>
                    <p>{category.desc}</p>
                  </div>
                  <span className={`category-score ${numValue >= 75 ? 'high' : ''}`}>
                    {numValue}
                  </span>
                </div>
                <div className="category-progress-bar">
                  <div
                    className={`category-progress-fill ${numValue >= 75 ? 'high' : ''}`}
                    style={{ width: `${Math.min(100, Math.max(0, numValue))}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          {/* Business Viability Category */}
          <div className="category-item">
            <div className="category-header">
              <div>
                <h3>Business Viability</h3>
                <p>Economic feasibility and scalability</p>
              </div>
              <span className={`category-score ${businessViabilityScore >= 75 ? 'high' : ''}`}>
                {businessViabilityScore}
              </span>
            </div>
            <div className="category-progress-bar">
              <div
                className={`category-progress-fill ${businessViabilityScore >= 75 ? 'high' : ''}`}
                style={{ width: `${businessViabilityScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="radar-card">
            <h2>Performance Comparison</h2>
            <p className="radar-description">Your idea vs. market average</p>
            <div className="radar-chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#999', fontSize: 10 }}
                  />
                  <Radar
                    name="Market Average"
                    dataKey="marketAvg"
                    stroke="#4a90e2"
                    fill="#4a90e2"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Your Idea"
                    dataKey="userValue"
                    stroke="#34a83a"
                    fill="#34a83a"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="radar-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#34a83a' }}></div>
                <span>Your Idea</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#4a90e2' }}></div>
                <span>Market Average</span>
              </div>
            </div>
          </div>
        )}

        {/* Strengths and Recommendations */}
        <div className="insights-grid">
          {/* Strengths / Gaps */}
          <div className="insight-card strengths-card">
            <div className="insight-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#34a83a" strokeWidth="2" />
                <path
                  d="M9 12 L11 14 L15 10"
                  stroke="#34a83a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3>Strengths</h3>
            </div>
            {displayStrengths.length > 0 ? (
              <ul className="insight-list">
                {displayStrengths.map((strength, i) => (
                  <li key={i}>
                    <span className="insight-text">{strength.issue || strength}</span>
                    {strength.evidence_source_id && (
                      <span className="source-badge">
                        Source: Case #{strength.evidence_source_id}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="insight-list">
                <li>Strong focus on material reuse and recycling</li>
                <li>Clear value proposition for sustainability</li>
                <li>Potential for scalable implementation</li>
              </ul>
            )}
            {displayGaps.length > 0 && (
              <>
                <div className="insight-header" style={{ marginTop: '20px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2" />
                    <path d="M12 8 L12 16 M8 12 L16 12" stroke="#ff9800" strokeWidth="2" />
                  </svg>
                  <h3>Gaps</h3>
                </div>
                <ul className="insight-list gaps-list">
                  {displayGaps.map((gap, i) => (
                    <li key={i}>
                      <span className="insight-text">{gap.issue || gap}</span>
                      {gap.evidence_source_id && (
                        <span className="source-badge">Source: Case #{gap.evidence_source_id}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Recommendations */}
          <div className="insight-card recommendations-card">
            <div className="insight-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#4a90e2" strokeWidth="2" />
                <text
                  x="12"
                  y="16"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#4a90e2"
                  fontWeight="bold"
                >
                  i
                </text>
              </svg>
              <h3>Recommendations</h3>
            </div>
            <ul className="insight-list">
              {result.audit?.technical_recommendations?.length > 0 ? (
                result.audit.technical_recommendations.map((rec, i) => <li key={i}>{rec}</li>)
              ) : (
                <>
                  <li>Consider incorporating predictive maintenance strategies</li>
                  <li>Explore partnerships with recycling facilities</li>
                  <li>Develop metrics for tracking circularity performance</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Database Evidence Section */}
        {result.similar_cases && result.similar_cases.length > 0 && (
          <div className="database-evidence-card">
            <div className="evidence-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="evidence-icon">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="#34a83a" strokeWidth="2" />
                <path
                  d="M8 8 L16 8 M8 12 L16 12 M8 16 L12 16"
                  stroke="#34a83a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <h2>Database Evidence</h2>
              <p className="evidence-subtitle">
                Similar cases from the circular economy research database
              </p>
            </div>
            <div className="evidence-cases">
              {result.similar_cases.map((caseItem, index) => {
                // Calculate match percentage from similarity score
                const matchPercentage = ((caseItem.similarity || 0) * 100).toFixed(1);

                // Get source case ID - try multiple possible fields
                const sourceCaseId =
                  caseItem.id || caseItem.case_id || caseItem.source_id || `#${index + 1}`;

                // Get content snippet
                const content =
                  caseItem.content || caseItem.text || caseItem.summary || 'No content available';

                // Get AI-generated summary for this case
                const caseTitle = casesSummaries[index] || `Related Case ${index + 1}`;

                return (
                  <div key={index} className="evidence-case-card">
                    <div className="case-header">
                      <div className="similarity-badge-bold">{matchPercentage}% Match</div>
                      <div className="case-id-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M8 8 L16 8 M8 12 L16 12 M8 16 L12 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Source Case {sourceCaseId}
                      </div>
                    </div>
                    <h3 className="case-title">{caseTitle}</h3>
                    <p className="case-content-clamped">{content}</p>
                    <button
                      className="view-context-btn"
                      onClick={() => setContextModal({ content, title: caseTitle })}
                    >
                      View Full Context →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="results-footer">
          <button className="back-button" onClick={onBack}>
            ← Evaluate Another Idea
          </button>
          <button className="criteria-button" onClick={onViewCriteria}>
            View Evaluation Criteria
          </button>
          <button className="download-button">Download Report</button>
        </div>
      </div>

      {/* Context Modal */}
      {contextModal && (
        <ContextModal
          onClose={() => setContextModal(null)}
          content={contextModal.content}
          title={contextModal.title}
        />
      )}

      <style jsx>{`
        .similarity-badge-bold {
          background: #34a83a;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: bold;
        }
        .case-title {
          margin: 12px 0 8px 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
          line-height: 1.4;
        }
        .case-content-clamped {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.6;
          color: #555;
          margin: 0;
        }
        .view-context-btn {
          margin-top: 12px;
          background: none;
          border: none;
          color: #34a83a;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 0;
          font-size: 14px;
          transition: color 0.2s;
        }
        .view-context-btn:hover {
          color: #2d8f32;
          text-decoration: underline;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #eee;
        }
        .modal-header h2 {
          margin: 0;
          color: #34a83a;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }
        .modal-body {
          padding: 24px;
        }
      `}</style>
    </div>
  );
}

// Evaluation Criteria View Component (l3.png)
function EvaluationCriteriaView({ onBack }) {
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
