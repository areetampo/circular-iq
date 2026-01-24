import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import RadarChartSection from '../components/RadarChartSection';
import EvidenceCard from '../components/EvidenceCard';
import ContextModal from '../components/ContextModal';
import AssessmentMethodologyModal from '../components/AssessmentMethodologyModal';
import EvaluationCriteriaModal from '../components/EvaluationCriteriaModal';
import TipCard from '../components/TipCard';
import ExportButton from '../components/ExportButton';
import { validKeys, categoryMapping } from '../constants/evaluationData';
import { categorizeIntegrityGaps } from '../utils/helpers';
import { exportSimilarCasesToCSV, exportAuditReportToPDF } from '../utils/exportSimple';
import { useToast } from '../hooks/useToast';
import { useExportState } from '../hooks/useExportState';

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
  const { addToast } = useToast();
  const { isExporting, executeExport } = useExportState();
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(isDetailView && id);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [contextModal, setContextModal] = useState(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

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

  // If not in detail view and no result data, redirect to home
  if (!isDetailView && !currentData) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No Assessment Data</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Please complete an evaluation first.
          </p>
          <button
            onClick={onBack}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#34a83a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ← Go to Evaluation
          </button>
        </div>
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

  const subScoreEntries = Object.entries(actualResult?.sub_scores || {});
  const topFactor =
    subScoreEntries.length > 0
      ? subScoreEntries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
      : null;
  const focusFactor =
    subScoreEntries.length > 0
      ? subScoreEntries.reduce((worst, curr) => (curr[1] < worst[1] ? curr : worst))
      : null;
  const avgFactorScore =
    subScoreEntries.length > 0
      ? Math.round(
          subScoreEntries.reduce((sum, [, val]) => sum + (Number(val) || 0), 0) /
            subScoreEntries.length,
        )
      : 0;

  const getFileNameBase = () => {
    return (
      (actualResult.metadata?.industry || 'circularity-report')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'circularity-report'
    );
  };

  const handleDownloadCSV = async () => {
    const actualResult = currentData?.result_json || currentData;
    if (!actualResult) {
      addToast('No result data available to export', 'error');
      return;
    }

    await executeExport(
      () => exportSimilarCasesToCSV(casesSummaries, actualResult.similar_cases || [], actualResult),
      'CSV',
    );
  };

  const handleDownloadPDF = async () => {
    const actualResult = currentData?.result_json || currentData;
    if (!actualResult) {
      addToast('No result data available to export', 'error');
      return;
    }

    await executeExport(
      () => exportAuditReportToPDF(currentData, radarData, businessViabilityScore, getRatingBadge),
      'PDF',
    );
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

        {/* Score Highlights */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Score Highlights</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                background: '#e8f5e9',
                border: '1px solid #c8e6c9',
                borderRadius: '10px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#2d5f2e', fontWeight: 700 }}>
                Strongest Factor
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1b5e20' }}>
                {topFactor ? titleize(topFactor[0]) : 'Not available'}
              </div>
              <div style={{ marginTop: '0.35rem', color: '#2d5f2e' }}>
                {topFactor ? `${topFactor[1]}/100` : 'Awaiting data'}
              </div>
            </div>

            <div
              style={{
                background: '#fff3e0',
                border: '1px solid #ffe0b2',
                borderRadius: '10px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#e65100', fontWeight: 700 }}>
                Focus Area
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#bf360c' }}>
                {focusFactor ? titleize(focusFactor[0]) : 'Not available'}
              </div>
              <div style={{ marginTop: '0.35rem', color: '#bf360c' }}>
                {focusFactor ? `${focusFactor[1]}/100` : 'Awaiting data'}
              </div>
            </div>

            <div
              style={{
                background: '#e3f2fd',
                border: '1px solid #bbdefb',
                borderRadius: '10px',
                padding: '1rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#1565c0', fontWeight: 700 }}>
                Average Factor Score
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0d47a1' }}>
                {avgFactorScore || 'Not available'} / 100
              </div>
              <div style={{ marginTop: '0.35rem', color: '#0d47a1' }}>
                Business Viability: {businessViabilityScore || 'N/A'} / 100
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips for New Users */}
        <div
          style={{
            background: '#f5f9ff',
            border: '2px dashed #4a90e2',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>💡 How to Use This Report</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <TipCard
              icon="📊"
              title="Your Score"
              description="The overall circularity rating out of 100. Compare this with similar projects to identify your competitive position."
            />
            <TipCard
              icon="✅"
              title="Strengths"
              description="Areas where your initiative excels. Leverage these as competitive advantages and marketing points."
            />
            <TipCard
              icon="⚡"
              title="Focus Areas"
              description="Priority improvements that could boost your score. Start with high-impact, low-effort changes first."
            />
            <TipCard
              icon="📈"
              title="Benchmarking"
              description="See how you compare to similar projects. Use this to set realistic improvement targets."
            />
            <TipCard
              icon="📥"
              title="Export Options"
              description="Save this assessment and download a PDF report to share with stakeholders or track changes over time."
            />
            <TipCard
              icon="🔄"
              title="Next Steps"
              description="Address the identified improvement areas and reassess after implementing changes to track progress."
            />
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
                  <div title={`Click to learn more about ${category.name}`}>
                    <h3>{category.name}</h3>
                    <p>{category.desc}</p>
                  </div>
                  <span
                    className={`category-score ${numValue >= 75 ? 'high' : ''}`}
                    title={`Score: ${numValue}/100`}
                  >
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
                  <div className="metric-score">
                    {actualResult.sub_scores?.tech_readiness || 0}/100
                  </div>
                </div>
              )}
              {actualResult.audit.key_metrics_comparison.scalability && (
                <div className="metric-card">
                  <h3>Scalability</h3>
                  <p className="metric-insight">
                    {actualResult.audit.key_metrics_comparison.scalability}
                  </p>
                  <div className="metric-score">
                    {actualResult.sub_scores?.infrastructure || 0}/100
                  </div>
                </div>
              )}
              {actualResult.audit.key_metrics_comparison.economic_viability && (
                <div className="metric-card">
                  <h3>Economic Viability</h3>
                  <p className="metric-insight">
                    {actualResult.audit.key_metrics_comparison.economic_viability}
                  </p>
                  <div className="metric-score">
                    {actualResult.sub_scores?.market_price || 0}/100
                  </div>
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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <ExportButton
              isLoading={isExporting}
              icon="📥"
              label="Similar Cases CSV"
              loadingLabel="Exporting..."
              onClick={handleDownloadCSV}
            />
            <ExportButton
              isLoading={isExporting}
              icon="📄"
              label="Download as PDF"
              loadingLabel="Generating..."
              onClick={handleDownloadPDF}
            />
            <button
              className="save-button"
              onClick={() => setShowSaveDialog(true)}
              disabled={isExporting}
            >
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
                        addToast('Please enter a title before saving', 'error');
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

// PropTypes validation for component props
ResultsView.propTypes = {
  result: PropTypes.object,
  radarData: PropTypes.array,
  businessViabilityScore: PropTypes.number,
  getRatingBadge: PropTypes.func,
  categoryMapping: PropTypes.object,
  validKeys: PropTypes.array,
  isDetailView: PropTypes.bool,
  onBack: PropTypes.func,
  onSaveAssessment: PropTypes.func,
  onViewHistory: PropTypes.func,
  onViewMarketAnalysis: PropTypes.func,
};

ResultsView.defaultProps = {
  result: null,
  radarData: [],
  businessViabilityScore: 0,
  getRatingBadge: () => 'Unknown',
  categoryMapping: {},
  validKeys: [],
  isDetailView: false,
  onBack: () => {},
  onSaveAssessment: () => {},
  onViewHistory: () => {},
  onViewMarketAnalysis: () => {},
};
