import { useState } from 'react';
import MetricInfoModal from '../components/MetricInfoModal';
import InfoIconButton from '../components/InfoIconButton';
import ParameterSliders from '../components/ParameterSliders';

export default function LandingView({
  businessProblem,
  setBusinessProblem,
  businessSolution,
  setBusinessSolution,
  parameters,
  setParameters,
  showAdvanced,
  setShowAdvanced,
  onSubmit,
  loading,
  error,
  showInfoIcons,
  testCaseSelector,
}) {
  const [showInfoModal, setShowInfoModal] = useState(null);

  const handleParameterChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: parseInt(value, 10),
    }));
  };

  const isFormValid = businessProblem.trim().length >= 200 && businessSolution.trim().length >= 200;

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
          <h2 style={{ margin: '0 0 12px 0' }}>Evaluate Your Circular Economy Business</h2>
          <p className="input-instructions">
            Describe your business idea using the same structure as real circular economy projects:
            what problem you solve, and how your solution addresses it.
          </p>

          {/* Two-Column Input Container */}
          <div className="input-fields-container">
            {/* Problem Input */}
            <div className="input-field">
              <div className="field-header">
                <h3>Business Problem</h3>
                {showInfoIcons && (
                  <InfoIconButton
                    onClick={() => setShowInfoModal('problem')}
                    title="Help with problem description"
                  />
                )}
              </div>
              <p className="field-guidance">
                What environmental or circular economy challenge does your business address?
              </p>
              <textarea
                className="idea-textarea"
                rows="4"
                placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually, depleting marine ecosystems and poisoning food chains. Current alternatives are either cost-prohibitive or require complex infrastructure..."
                value={businessProblem}
                onChange={(e) => setBusinessProblem(e.target.value)}
                disabled={loading}
              />
              <div className="char-count">
                {businessProblem.length}/200 minimum required
                {businessProblem.length >= 200 && ' ✓'}
              </div>
            </div>

            {/* Solution Input */}
            <div className="input-field">
              <div className="field-header">
                <h3>Business Solution</h3>
                {showInfoIcons && (
                  <InfoIconButton
                    onClick={() => setShowInfoModal('solution')}
                    title="Help with solution description"
                  />
                )}
              </div>
              <p className="field-guidance">
                How does your business solve this problem? Include materials, processes, and
                circularity strategy.
              </p>
              <textarea
                className="idea-textarea"
                rows="4"
                placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste, combined with a hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we aggregate returns at regional hubs; certified composting facilities process 95% of materials into soil amendments sold back to agriculture..."
                value={businessSolution}
                onChange={(e) => setBusinessSolution(e.target.value)}
                disabled={loading}
              />
              <div className="char-count">
                {businessSolution.length}/200 minimum required
                {businessSolution.length >= 200 && ' ✓'}
              </div>
            </div>
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
                <InfoIconButton
                  onClick={() => setShowInfoModal('factors')}
                  title="Learn about evaluation factors"
                  size={18}
                />
              )}
            </div>

            {showAdvanced && (
              <ParameterSliders
                parameters={parameters}
                onParameterChange={handleParameterChange}
                loading={loading}
                onShowInfo={setShowInfoModal}
              />
            )}
          </div>

          <button className="submit-button" onClick={onSubmit} disabled={loading || !isFormValid}>
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

          {/* Test Case Selector */}
          {testCaseSelector}
        </div>

        {/* Footer */}
        <p className="footer-disclaimer">
          Based on research synthesis of AI applications in circular economy domains.
        </p>
      </div>

      {/* Info Modals */}
      {showInfoModal && (
        <MetricInfoModal onClose={() => setShowInfoModal(null)} type={showInfoModal} />
      )}
    </div>
  );
}
