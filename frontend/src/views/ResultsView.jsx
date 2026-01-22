import { useState } from 'react';
import RadarChartSection from '../components/RadarChartSection';
import EvidenceCard from '../components/EvidenceCard';
import ContextModal from '../components/ContextModal';
import AssessmentMethodologyModal from '../components/AssessmentMethodologyModal';
import EvaluationCriteriaModal from '../components/EvaluationCriteriaModal';
import { validKeys, categoryMapping } from '../constants/evaluationData';
import { categorizeIntegrityGaps } from '../utils/helpers';

export default function ResultsView({
  result,
  radarData,
  businessViabilityScore,
  getRatingBadge,
  onBack,
}) {
  const [contextModal, setContextModal] = useState(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  const overallScore = result?.overall_score != null ? Number(result.overall_score) : 0;
  const rating = getRatingBadge(overallScore);

  const { strengths, gaps } = categorizeIntegrityGaps(result.audit?.integrity_gaps);
  const casesSummaries = result.audit?.similar_cases_summaries || [];

  const getConfidenceLevel = (score) => {
    if (!score) return 'low';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

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

          {/* Info Buttons */}
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}
          >
            <button
              className="criteria-button"
              onClick={() => setShowMethodologyModal(true)}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
            >
              📊 View Assessment Methodology
            </button>
            <button
              className="criteria-button"
              onClick={() => setShowCriteriaModal(true)}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
            >
              📋 View Evaluation Criteria
            </button>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="executive-summary-card">
          <div className="summary-header">
            <h2>Executive Summary</h2>
            <div
              className={`confidence-badge confidence-${getConfidenceLevel(result.audit?.confidence_score)}`}
            >
              {result.audit?.confidence_score || 0}% Confidence
            </div>
          </div>
          {result.audit?.audit_verdict && (
            <p className="verdict-text">{result.audit.audit_verdict}</p>
          )}
          {result.audit?.comparative_analysis && (
            <div className="key-finding">
              <strong>Key Finding:</strong> {result.audit.comparative_analysis}
            </div>
          )}

          {/* Quick Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #e3f2fd',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Overall Score
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#34a83a' }}>
                {overallScore}/100
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #e3f2fd',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Database Cases Analyzed
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#4a90e2' }}>
                {casesSummaries.length || 0}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #e3f2fd',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Strengths Identified
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#28a745' }}>
                {strengths.length || 0}
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #e3f2fd',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginBottom: '0.25rem',
                  fontWeight: '600',
                }}
              >
                Improvement Areas
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ff9800' }}>
                {gaps.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Verdict */}
        {result.audit?.audit_verdict && (
          <div className="verdict-card prominent">
            <h2>Auditor's Verdict</h2>
            <p className="verdict-text">{result.audit.audit_verdict}</p>
          </div>
        )}

        {/* Integrity Analysis Section */}
        {(gaps.length > 0 || strengths.length > 0) && (
          <div className="integrity-analysis-card">
            <h2>Integrity Analysis</h2>
            <p className="integrity-explanation">
              We compare your self-assessed scores against real-world projects in our database to
              identify potential overestimations or underestimations.
            </p>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="strengths-group">
                <h3 className="group-title">✓ Strengths Validated</h3>
                <div className="strength-items">
                  {strengths.map((strength, i) => (
                    <div key={i} className="strength-item">
                      <span className="strength-icon">✓</span>
                      <div className="strength-content">
                        <p className="strength-aspect">{strength.issue || strength}</p>
                        {strength.evidence_source_id && (
                          <span className="evidence-badge">
                            Validated by Case #{strength.evidence_source_id}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps/Issues */}
            {gaps.length > 0 && (
              <div className="gaps-group">
                <h3 className="group-title">⚠ Areas for Improvement</h3>
                <div className="gap-items">
                  {gaps.map((gap, i) => (
                    <div
                      key={i}
                      className={`integrity-gap gap-severity-${gap.severity || 'medium'}`}
                    >
                      <span className="gap-icon">!</span>
                      <div className="gap-content">
                        <p className="gap-issue">{gap.issue || gap}</p>
                        <p className="gap-severity">
                          {gap.severity
                            ? gap.severity.charAt(0).toUpperCase() + gap.severity.slice(1)
                            : 'Medium'}{' '}
                          severity
                        </p>
                        {gap.evidence_source_id && (
                          <span className="evidence-badge">
                            See Case #{gap.evidence_source_id} for context
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            if (!(result.sub_scores && key in result.sub_scores)) return null;

            const category = categoryMapping[key];
            if (!category) return null;

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
        <RadarChartSection radarData={radarData} />

        {/* Comparative Metrics Dashboard */}
        {result.audit?.key_metrics_comparison && (
          <div className="metrics-comparison-card">
            <h2>Key Metrics Comparison</h2>
            <p className="metrics-explanation">
              How your assessed metrics compare to similar projects in our database
            </p>
            <div className="comparison-grid">
              {result.audit.key_metrics_comparison.market_readiness && (
                <div className="metric-card">
                  <h3>Market Readiness</h3>
                  <p className="metric-insight">
                    {result.audit.key_metrics_comparison.market_readiness}
                  </p>
                  <div className="metric-score">{result.sub_scores?.tech_readiness || 0}/100</div>
                </div>
              )}
              {result.audit.key_metrics_comparison.scalability && (
                <div className="metric-card">
                  <h3>Scalability</h3>
                  <p className="metric-insight">
                    {result.audit.key_metrics_comparison.scalability}
                  </p>
                  <div className="metric-score">{result.sub_scores?.infrastructure || 0}/100</div>
                </div>
              )}
              {result.audit.key_metrics_comparison.economic_viability && (
                <div className="metric-card">
                  <h3>Economic Viability</h3>
                  <p className="metric-insight">
                    {result.audit.key_metrics_comparison.economic_viability}
                  </p>
                  <div className="metric-score">{result.sub_scores?.market_price || 0}/100</div>
                </div>
              )}
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
            {strengths.length > 0 ? (
              <ul className="insight-list">
                {strengths.map((strength, i) => (
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
            {gaps.length > 0 && (
              <>
                <div className="insight-header" style={{ marginTop: '20px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2" />
                    <path d="M12 8 L12 16 M8 12 L16 12" stroke="#ff9800" strokeWidth="2" />
                  </svg>
                  <h3>Gaps</h3>
                </div>
                <ul className="insight-list gaps-list">
                  {gaps.map((gap, i) => (
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
                const caseTitle = casesSummaries[index] || `Related Case ${index + 1}`;
                return (
                  <EvidenceCard
                    key={index}
                    caseItem={caseItem}
                    index={index}
                    caseTitle={caseTitle}
                    onViewContext={setContextModal}
                  />
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

      {/* Assessment Methodology Modal */}
      {showMethodologyModal && (
        <AssessmentMethodologyModal onClose={() => setShowMethodologyModal(false)} />
      )}

      {/* Evaluation Criteria Modal */}
      {showCriteriaModal && <EvaluationCriteriaModal onClose={() => setShowCriteriaModal(false)} />}
    </div>
  );
}
