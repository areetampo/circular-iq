import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  categoryMapping: passedCategoryMapping,
  validKeys: passedValidKeys,
  isDetailView,
  onBack,
  onSaveAssessment,
  onViewHistory,
  onViewMarketAnalysis,
}) {
  const { id } = useParams();
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(isDetailView && id);

  const [contextModal, setContextModal] = useState(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load detail view if needed
  useEffect(() => {
    if (isDetailView && id) {
      fetch(`${apiBase}/assessments/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setDetailData(data.assessment);
          setDetailLoading(false);
        })
        .catch(() => setDetailLoading(false));
    }
  }, [id, isDetailView, apiBase]);

  const currentData = isDetailView ? detailData : result;
  const currentTitle = passedCategoryMapping || categoryMapping;
  const currentValidKeys = passedValidKeys || validKeys;

  if (detailLoading) {
    return (
      <div className="app-container">
        <p>Loading assessment...</p>
      </div>
    );
  }

  if (isDetailView && !currentData) {
    return (
      <div className="app-container">
        <p>Assessment not found</p>
      </div>
    );
  }

  const actualResult = currentData?.result_json || currentData;
  const overallScore = actualResult?.overall_score != null ? Number(actualResult.overall_score) : 0;
  const rating = getRatingBadge(overallScore);

  const { strengths, gaps } = categorizeIntegrityGaps(actualResult.audit?.integrity_gaps);
  const casesSummaries = actualResult.audit?.similar_cases_summaries || [];

  const getConfidenceLevel = (score) => {
    if (!score) return 'low';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  // Human-friendly helpers for metadata display
  const titleize = (txt) =>
    txt
      ? String(txt)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : 'N/A';

  const fieldHelp = {
    industry: 'Sector we matched from your description',
    scale: 'Maturity/footprint: prototype, pilot, regional, commercial, global',
    r_strategy: 'Dominant circular economy strategy (e.g., Reduce, Reuse, Recycle)',
    primary_material: 'Main material or waste stream this solution targets',
    geographic_focus: 'Primary market or region you aim to serve',
  };

  const classificationItemStyle = {
    background: '#fff',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #c8e6c9',
  };

  const getFileNameBase = () => {
    return (
      (actualResult.metadata?.industry || 'circularity-report')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'circularity-report'
    );
  };

  const handleDownloadCSV = () => {
    if (!result) return alert('No result data available to download.');

    const rows = [
      ['Circularity Assessment Report'],
      ['Generated', new Date().toISOString()],
      [],
      ['SCORES'],
      ['Overall Score', overallScore],
      ['Business Viability', businessViabilityScore],
      ...(actualResult.sub_scores
        ? Object.entries(actualResult.sub_scores).map(([key, val]) => [key.replace(/_/g, ' '), val])
        : []),
      [],
      ['METADATA'],
      ['Industry', actualResult.metadata?.industry || 'N/A'],
      ['Scale', actualResult.metadata?.scale || 'N/A'],
      ['Circular Strategy', actualResult.metadata?.r_strategy || 'N/A'],
      ['Material Focus', actualResult.metadata?.primary_material || 'N/A'],
      ['Geographic Focus', actualResult.metadata?.geographic_focus || 'N/A'],
      [],
      ['BENCHMARKS'],
      ['Your Score', overallScore],
      ['Similar Projects Average', actualResult.gap_analysis?.overall_benchmarks?.average || 'N/A'],
      ['Top 10% Threshold', actualResult.gap_analysis?.overall_benchmarks?.top_10_percentile || 'N/A'],
      ['Median', actualResult.gap_analysis?.overall_benchmarks?.median || 'N/A'],
      [],
      ['AUDIT VERDICT'],
      [actualResult.audit?.audit_verdict || 'No verdict available'],
      [],
      ['RECOMMENDATIONS'],
      ...(actualResult.audit?.technical_recommendations || []).map((rec) => [rec]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === 'string' && cell.includes(',')
                ? `"${cell.replace(/"/g, '""')}"`
                : cell,
            )
            .join(','),
        )
        .join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${getFileNameBase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!result) return alert('No result data available to download.');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Circularity Assessment Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            h1 { color: #34a83a; border-bottom: 3px solid #34a83a; padding-bottom: 10px; }
            h2 { color: #2c3e50; margin-top: 30px; border-left: 4px solid #34a83a; padding-left: 10px; }
            .score-display { font-size: 28px; font-weight: bold; color: #34a83a; margin: 20px 0; }
            .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .metadata-item { border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; background-color: #f9f9f9; }
            .metadata-item strong { color: #1b5e20; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #34a83a; color: white; font-weight: bold; }
            .verdict { background-color: #e8f5e9; border-left: 4px solid #34a83a; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <h1>Circularity Assessment Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <h2>Overall Score</h2>
          <div class="score-display">${overallScore}/100</div>
          <h2>Executive Summary</h2>
          <div class="verdict"><p>${actualResult.audit?.audit_verdict || 'No verdict available'}</p></div>
          <h2>Project Classification</h2>
          <div class="metadata-grid">
            <div class="metadata-item"><strong>Industry:</strong> ${titleize(actualResult.metadata?.industry || 'N/A')}</div>
            <div class="metadata-item"><strong>Scale:</strong> ${titleize(actualResult.metadata?.scale || 'N/A')}</div>
            <div class="metadata-item"><strong>Strategy:</strong> ${titleize(actualResult.metadata?.r_strategy || 'N/A')}</div>
            <div class="metadata-item"><strong>Material:</strong> ${titleize(actualResult.metadata?.primary_material || 'N/A')}</div>
          </div>
          <h2>Detailed Scores</h2>
          <table>
            <tr><th>Factor</th><th>Score</th></tr>
            ${Object.entries(actualResult.sub_scores || {})
              .map(([key, val]) => `<tr><td>${key.replace(/_/g, ' ')}</td><td>${val}</td></tr>`)
              .join('')}
            <tr><td><strong>Business Viability</strong></td><td><strong>${businessViabilityScore}</strong></td></tr>
          </table>
          <div class="footer"><p>Report generated by Circular Economy Business Auditor</p></div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
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
              className={`confidence-badge confidence-${getConfidenceLevel(actualResult.audit?.confidence_score)}`}
            >
              {actualResult.audit?.confidence_score || 0}% Confidence
            </div>
          </div>
          {actualResult.audit?.audit_verdict && (
            <p className="verdict-text">{actualResult.audit.audit_verdict}</p>
          )}
          {actualResult.audit?.comparative_analysis && (
            <div className="key-finding">
              <strong>Key Finding:</strong> {actualResult.audit.comparative_analysis}
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
        {actualResult.audit?.audit_verdict && (
          <div className="verdict-card prominent">
            <h2>Auditor's Verdict</h2>
            <p className="verdict-text">{actualResult.audit.audit_verdict}</p>
          </div>
        )}

        {/* Gap Analysis & Benchmarks Section */}
        {actualResult.gap_analysis?.has_benchmarks && (
          <div
            style={{
              background: '#f0f4f8',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '2px solid #4a90e2',
            }}
          >
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>
              📊 Your Performance vs. Similar Projects
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Your Score
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34a83a' }}>
                  {actualResult.overall_score}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Similar Projects Average
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4a90e2' }}>
                  {Math.round(actualResult.gap_analysis.overall_benchmarks.average)}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Top 10% Threshold
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9c27b0' }}>
                  {actualResult.gap_analysis.overall_benchmarks.top_10_percentile}
                </div>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Median
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#26a69a' }}>
                  {actualResult.gap_analysis.overall_benchmarks.median}
                </div>
              </div>
            </div>

            {Object.keys(actualResult.gap_analysis.sub_score_gaps).length > 0 && (
              <div>
                <h3 style={{ margin: '1.5rem 0 1rem 0', color: '#2c3e50' }}>
                  Factor-by-Factor Analysis
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {Object.entries(actualResult.gap_analysis.sub_score_gaps).map(([factor, gap]) => (
                    <div
                      key={factor}
                      style={{
                        background: '#fff',
                        padding: '1rem',
                        borderRadius: '8px',
                        borderLeft: gap.gap > 5 ? '4px solid #ff9800' : '4px solid #4caf50',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: '#2c3e50',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>Your Score:</span>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#34a83a' }}>
                            {gap.user_score}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>Benchmark:</span>
                          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#4a90e2' }}>
                            {gap.benchmark_average}
                          </div>
                        </div>
                      </div>
                      {gap.gap > 0 ? (
                        <div style={{ fontSize: '0.85rem', color: '#ff9800', fontWeight: 'bold' }}>
                          ↑ Opportunity: +{gap.gap} points possible
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: '#4caf50', fontWeight: 'bold' }}>
                          ✓ Above benchmark by {Math.abs(gap.gap)} points
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                        {gap.percentile}th percentile vs. similar projects
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Industry & Metadata Section */}
        {actualResult.metadata && (
          <div
            style={{
              background: '#e8f5e9',
              padding: '1.5rem',
              borderRadius: '10px',
              marginBottom: '2rem',
              border: '2px solid #34a83a',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', color: '#2d5f2e' }}>📋 Project Classification</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              <div style={classificationItemStyle}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#2d5f2e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                  title={fieldHelp.industry}
                >
                  Industry
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    color: '#1b5e20',
                    marginTop: '0.25rem',
                    fontWeight: 700,
                  }}
                >
                  {titleize(actualResult.metadata.industry)}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#2d5f2e99',
                    marginTop: '0.25rem',
                    fontStyle: 'italic',
                  }}
                >
                  {fieldHelp.industry}
                </div>
              </div>
              <div style={classificationItemStyle}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#2d5f2e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                  title={fieldHelp.scale}
                >
                  Scale
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    color: '#1b5e20',
                    marginTop: '0.25rem',
                    fontWeight: 700,
                  }}
                >
                  {titleize(actualResult.metadata.scale)}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#2d5f2e99',
                    marginTop: '0.25rem',
                    fontStyle: 'italic',
                  }}
                >
                  {fieldHelp.scale}
                </div>
              </div>
              <div style={classificationItemStyle}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#2d5f2e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                  title={fieldHelp.r_strategy}
                >
                  Circular Strategy
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    color: '#1b5e20',
                    marginTop: '0.25rem',
                    fontWeight: 700,
                  }}
                >
                  {titleize(actualResult.metadata.r_strategy)}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#2d5f2e99',
                    marginTop: '0.25rem',
                    fontStyle: 'italic',
                  }}
                >
                  {fieldHelp.r_strategy}
                </div>
              </div>
              <div style={classificationItemStyle}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#2d5f2e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                  title={fieldHelp.primary_material}
                >
                  Material Focus
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    color: '#1b5e20',
                    marginTop: '0.25rem',
                    fontWeight: 700,
                  }}
                >
                  {titleize(actualResult.metadata.primary_material)}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#2d5f2e99',
                    marginTop: '0.25rem',
                    fontStyle: 'italic',
                  }}
                >
                  {fieldHelp.primary_material}
                </div>
              </div>
              <div style={classificationItemStyle}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#2d5f2e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                  title={fieldHelp.geographic_focus}
                >
                  Geographic Focus
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    color: '#1b5e20',
                    marginTop: '0.25rem',
                    fontWeight: 700,
                  }}
                >
                  {titleize(actualResult.metadata.geographic_focus)}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#2d5f2e99',
                    marginTop: '0.25rem',
                    fontStyle: 'italic',
                  }}
                >
                  {fieldHelp.geographic_focus}
                </div>
              </div>
            </div>
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
            const value = actualResult.sub_scores?.[key];
            if (!(actualResult.sub_scores && key in actualResult.sub_scores)) return null;

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
        {actualResult.audit?.key_metrics_comparison && (
          <div className="metrics-comparison-card">
            <h2>Key Metrics Comparison</h2>
            <p className="metrics-explanation">
              How your assessed metrics compare to similar projects in our database
            </p>
            <div className="comparison-grid">
              {actualResult.audit.key_metrics_comparison.market_readiness && (
                <div className="metric-card">
                  <h3>Market Readiness</h3>
                  <p className="metric-insight">
                    {actualResult.audit.key_metrics_comparison.market_readiness}
                  </p>
                  <div className="metric-score">{actualResult.sub_scores?.tech_readiness || 0}/100</div>
                </div>
              )}
              {actualResult.audit.key_metrics_comparison.scalability && (
                <div className="metric-card">
                  <h3>Scalability</h3>
                  <p className="metric-insight">
                    {actualResult.audit.key_metrics_comparison.scalability}
                  </p>
                  <div className="metric-score">{actualResult.sub_scores?.infrastructure || 0}/100</div>
                </div>
              )}
              {actualResult.audit.key_metrics_comparison.economic_viability && (
                <div className="metric-card">
                  <h3>Economic Viability</h3>
                  <p className="metric-insight">
                    {actualResult.audit.key_metrics_comparison.economic_viability}
                  </p>
                  <div className="metric-score">{actualResult.sub_scores?.market_price || 0}/100</div>
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
              {actualResult.audit?.technical_recommendations?.length > 0 ? (
                actualResult.audit.technical_recommendations.map((rec, i) => <li key={i}>{rec}</li>)
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
        {actualResult.similar_cases && actualResult.similar_cases.length > 0 && (
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
              {actualResult.similar_cases.map((caseItem, index) => {
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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="back-button" onClick={onBack}>
              ← Evaluate Another Idea
            </button>
            <button className="secondary-button" onClick={onViewHistory}>
              📋 My Assessments
            </button>
            <button className="secondary-button" onClick={onViewMarketAnalysis}>
              📊 Market Analysis
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="download-button" onClick={handleDownloadCSV}>
              📥 Download as CSV
            </button>
            <button className="download-button" onClick={handleDownloadPDF}>
              📄 Download as PDF
            </button>
            <button className="save-button" onClick={() => setShowSaveDialog(true)}>
              💾 Save Assessment
            </button>
          </div>
        </div>

        {/* Save Assessment Dialog */}
        {showSaveDialog && (
          <div className="modal-overlay">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Save This Assessment</h2>
                  <button className="modal-close" onClick={() => setShowSaveDialog(false)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <label>
                    <strong>Assessment Title:</strong>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Q1 2026 - Textile Recycling Initiative"
                    value={assessmentTitle}
                    onChange={(e) => setAssessmentTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginBottom: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div className="modal-footer">
                  <button className="modal-cancel-button" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </button>
                  <button
                    className="modal-save-button"
                    onClick={() => {
                      if (assessmentTitle.trim()) {
                        onSaveAssessment(assessmentTitle);
                        setShowSaveDialog(false);
                        setAssessmentTitle('');
                      } else {
                        alert('Please enter a title');
                      }
                    }}
                  >
                    Save Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
