import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import RadarChart from '@/components/charts/RadarChart';
import AssessmentMethodologyModal from '@/components/modals/header/AssessmentMethodologyModal';
import EvaluationCriteriaModal from '@/components/modals/header/EvaluationCriteriaModal';
import MarketAnalysisModal from '@/components/modals/results/MarketAnalysisModal';
import TipCard from '@/components/common/TipCard';
import { exportAssessmentCSV, exportAssessmentPDF } from '@/features/export';
import { validKeys, categoryMapping } from '@/constants/evaluationData';
import { categorizeIntegrityGaps, extractCaseInfo, extractProblemSolution } from '@/utils/content';
import { useToast } from '@/hooks/useToast';
import { toast } from '@/hooks/use-toast';
import { useExportState } from '@/hooks/useExportState';
import { useSession } from '@/features/session/hooks/useSession';
import Loader from '@/components/common/Loader';
import { SaveAssessmentDialog } from '@/components/dialogs';
import { Button } from '@/components/ui/button';
import { CaseSummary } from '@/components/results';
import { Frown, FileText, NotebookText, Share } from 'lucide-react';
import AppContainer from '@/components/layout/AppContainer';
import './ResultsPage.css';
import { titleize } from '@/lib/formatting';
import { useAssessment, useCreateAssessment } from '@/features/assessments';

const fallbackGetRatingBadge = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
};

export default function ResultsPage({
  result = null,
  radarData = [],
  businessViabilityScore = 0,
  getRatingBadge = fallbackGetRatingBadge,
  categoryMapping: passedCategoryMapping,
  validKeys: passedValidKeys,
  isDetailView = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { isExporting, executeExport } = useExportState();
  const { saveEvaluation, restoreEvaluation } = useSession();
  const { createAssessmentAsync, isPending: isSaving } = useCreateAssessment();
  const [sessionRestored, setSessionRestored] = useState(false);

  // Extract result and formData from navigation state
  const navigationResult = location.state?.result;
  const navigationFormData = location.state?.formData;
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [resultsDetailedDatabaseEvidenceModalData, setResultsDetailedDatabaseEvidenceModalData] =
    useState(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showMarketAnalysisModal, setShowMarketAnalysisModal] = useState(false);

  // Persist result to session on mount or when result changes
  useEffect(() => {
    if (!isDetailView && navigationResult) {
      saveEvaluation({
        result: navigationResult,
        formData: navigationFormData,
      });
    }
  }, [navigationResult, navigationFormData, isDetailView, saveEvaluation]);

  // Show info toast if session was restored
  useEffect(() => {
    if (!isDetailView && !navigationResult && restoreEvaluation()?.result && !sessionRestored) {
      addToast('Previous session restored.', 'info');
      setSessionRestored(true);
    }
  }, [isDetailView, navigationResult, restoreEvaluation, sessionRestored, addToast]);

  // Fetch assessment data for detail view using hook
  const { assessment, isLoading, isError, error, refetch } = useAssessment(id, {
    enabled: isDetailView && !!id,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  });

  const detailLoading = isLoading;
  const detailError = error;
  const detailData = assessment;

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (isDetailView) {
      navigate('/assessments');
    } else {
      navigate('/');
    }
  }, [isDetailView, navigate]);

  const handleViewHistory = useCallback(() => {
    navigate('/assessments');
  }, [navigate]);

  const handleReevaluate = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Smart market analysis: use modal instead of routing
  const handleMarketAnalysis = useCallback(() => {
    setShowMarketAnalysisModal(true);
  }, []);

  // Save assessment handler
  const handleSave = useCallback(
    async (name) => {
      try {
        const saveData = {
          name,
          result_json: currentData,
          industry: currentData?.metadata?.industry || 'Unknown',
          session_id: navigationFormData?.sessionId || Date.now().toString(),
        };

        await createAssessmentAsync(saveData);
        addToast('Assessment saved successfully!', 'success');
        setShowSaveDialog(false);
        navigate('/assessments');
      } catch (error) {
        console.error('Save error:', error);
        addToast('Failed to save assessment. Please try again.', 'error');
      }
    },
    [currentData, navigationFormData, createAssessmentAsync, addToast, navigate],
  );

  // Smart data resolution: detail view > navigation state > session restoration
  const currentData = isDetailView
    ? detailData
    : navigationResult || restoreEvaluation()?.result || null;

  const resolvedCategoryMapping =
    passedCategoryMapping && Object.keys(passedCategoryMapping).length > 0
      ? passedCategoryMapping
      : categoryMapping;

  const resolvedValidKeys =
    Array.isArray(passedValidKeys) && passedValidKeys.length > 0 ? passedValidKeys : validKeys;

  const ratingFn = getRatingBadge || fallbackGetRatingBadge;

  const actualResult = currentData?.result_json || currentData || null;

  const computeMarketAvg = (res) => {
    if (!res?.similar_cases || res.similar_cases.length === 0) return 65;
    return (
      res.similar_cases.reduce((acc, curr) => acc + (curr.similarity || 0) * 100, 0) /
      res.similar_cases.length
    );
  };

  const resolvedRadarData = useMemo(() => {
    if (!actualResult?.sub_scores) return [];
    const marketAvg = computeMarketAvg(actualResult);

    return resolvedValidKeys
      .filter((key) => key in (actualResult.sub_scores || {}))
      .map((key) => {
        const value = actualResult.sub_scores[key];
        const numValue = value != null && !isNaN(value) ? Number(value) : 0;
        return {
          subject: resolvedCategoryMapping[key]?.name || key.replace(/_/g, ' '),
          userValue: numValue,
          marketAvg,
        };
      });
  }, [actualResult, resolvedCategoryMapping, resolvedValidKeys]);

  const computeBusinessViabilityScore = (res) => {
    if (!res) return 0;
    const confidence = res.audit?.confidence_score;
    const normalizedConfidence =
      confidence != null && confidence <= 1
        ? (Number(confidence) || 0) * 100
        : Number(confidence) || 0;

    return Math.round((Number(res.overall_score) || 0) * 0.7 + normalizedConfidence * 0.3);
  };

  const resolvedBusinessViabilityScore = computeBusinessViabilityScore(actualResult);

  if (detailLoading) {
    return (
      <Loader heading="Loading Assessment" message="Please wait while we retrieve your data..." />
    );
  }

  if (isDetailView && detailError) {
    return (
      <AppContainer
        headerProps={{
          showLogo: false,
          title: 'Unable to load assessment',
          subtitle: `Error: ${detailError}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={refetch}
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
            Retry
          </button>
          <button
            onClick={handleBack}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Go Back
          </button>
        </div>
      </AppContainer>
    );
  }

  if (isDetailView && !currentData) {
    return (
      <AppContainer
        headerProps={{
          showLogo: false,
          title: 'Sorry!',
          subtitle: 'The requested assessment could not be found.',
        }}
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={refetch}>Retry</Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </AppContainer>
    );
  }

  // If no assessment data found in any source, show error
  if (!currentData) {
    return (
      <AppContainer
        headerProps={{
          showLogo: false,
          title: 'No Assessment Data',
          subtitle: 'Please complete an assessment to view results.',
        }}
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => navigate('/')}>Back to Evaluate</Button>
        </div>
      </AppContainer>
    );
  }

  const overallScore = actualResult?.overall_score != null ? Number(actualResult.overall_score) : 0;
  const rating = ratingFn(overallScore);

  const { strengths, gaps } = categorizeIntegrityGaps(actualResult.audit?.integrity_gaps);
  const casesSummaries = actualResult.audit?.similar_cases_summaries || [];

  const getConfidenceLevel = (score) => {
    if (!score) return 'low';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

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
    if (!actualResult) {
      addToast('No result data available to export', 'error');
      return;
    }

    await executeExport(() => exportAssessmentCSV(currentData), 'CSV');
  };

  const handleDownloadPDF = async () => {
    if (!actualResult) {
      addToast('No result data available to export', 'error');
      return;
    }

    await executeExport(
      () => exportAssessmentPDF(currentData, { elementId: 'results-content' }),
      'PDF',
    );
  };

  const handleShareLink = useCallback(async () => {
    const assessmentPath = id ? `/results/${id}` : window.location.pathname;
    const shareUrl = `${window.location.origin}${assessmentPath}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link Copied',
        description: 'Anyone with this link can now view this assessment.',
      });
    } catch (err) {
      addToast('Failed to copy link to clipboard', 'error');
    }
  }, [addToast, id]);

  const defaultAssessmentName = useMemo(() => {
    const source = isDetailView ? fetchedAssessment : currentData;
    if (!source) return '';

    const base =
      source.caseName || source.projectTitle || source.metadata?.industry || 'Assessment';

    const date = new Date().toISOString().split('T')[0];
    return `${base} - ${date}`;
  }, [isDetailView, fetchedAssessment, currentData]);

  return (
    <AppContainer
      // className="app-container"
      headerProps={{
        title: 'Circularity Assessment Results',
        subtitle: "AI-powered evaluation of your business idea's circular economy potential",
        showAssessmentMethodologyButton: true,
        showEvaluationCriteriaButton: true,
        showMyAssessmentsButton: true,
      }}
    >
      {/* Action Buttons */}
      <div className="results-footer">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="back-button" onClick={handleBack}>
            {isDetailView ? '← Back to History' : '← Evaluate Another Idea'}
          </button>
          <button className="secondary-button" onClick={handleViewHistory}>
            📋 My Assessments
          </button>
          <button className="secondary-button" onClick={handleMarketAnalysis}>
            📊 Market Analysis
          </button>
          {/* Market Analysis Modal */}
          <MarketAnalysisModal
            isOpen={showMarketAnalysisModal}
            onClose={() => setShowMarketAnalysisModal(false)}
            currentAssessmentScore={actualResult?.overall_score}
            currentIndustry={actualResult?.metadata?.industry}
          />
          {isDetailView && currentData && (
            <button className="secondary-button" onClick={handleReevaluate}>
              🔄 Re-evaluate
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button disabled={isExporting} onClick={handleDownloadCSV} variant="outline">
            {isExporting ? '⏳ Exporting...' : '📥 Similar Cases CSV'}
          </Button>
          <Button disabled={isExporting} onClick={handleDownloadPDF} variant="outline">
            {isExporting ? '⏳ Generating...' : '📄 Download as PDF'}
          </Button>
          <Button disabled={isExporting} onClick={handleShareLink} variant="outline">
            <Share className="w-4 h-4 mr-2" /> Share
          </Button>
          {!isDetailView && (
            <button
              className="save-button"
              onClick={() => setShowSaveDialog(true)}
              disabled={isExporting}
            >
              💾 Save Assessment
            </button>
          )}
        </div>
      </div>

      {/* Results Content */}
      <div id="results-content" className="p-8 space-y-10 bg-white">
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
              <strong>Key Finding:</strong> <span>{actualResult.audit.comparative_analysis}</span>
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
                {overallScore} / 100
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

        {/* Case Summary */}
        <div data-export-section="case-summary">
          <CaseSummary
            caseInfo={extractCaseInfo(currentData)}
            problemSolution={extractProblemSolution(currentData)}
          />
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
                {topFactor ? `${topFactor[1]} / 100` : 'Awaiting data'}
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
                {focusFactor ? `${focusFactor[1]} / 100` : 'Awaiting data'}
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
                Business Viability: {resolvedBusinessViabilityScore || 'N/A'} / 100
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
            <h2>Auditor&apos;s Verdict</h2>
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
                <h3 className="group-title">⚠️ Areas for Improvement</h3>
                <div className="gap-items">
                  {gaps.map((gap, i) => (
                    <div
                      key={i}
                      className={`integrity-gap gap-severity-${gap.severity || 'medium'}`}
                    >
                      <span className="gap-icon">!</span>
                      <div className="gap-content">
                        <p className="gap-issue">{(gap.issue || gap).replace(/_/g, ' ')}</p>
                        <p className="gap-severity">
                          {gap.severity
                            ? gap.severity.charAt(0).toUpperCase() + gap.severity.slice(1)
                            : 'Medium'}
                          &nbsp; severity
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
          {resolvedValidKeys.map((key) => {
            const value = actualResult.sub_scores?.[key];
            if (!(actualResult.sub_scores && key in actualResult.sub_scores)) return null;

            const category = resolvedCategoryMapping[key];
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
                    title={`Score: ${numValue} / 100`}
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
              <span
                className={`category-score ${resolvedBusinessViabilityScore >= 75 ? 'high' : ''}`}
              >
                {resolvedBusinessViabilityScore}
              </span>
            </div>
            <div className="category-progress-bar">
              <div
                className={`category-progress-fill ${
                  resolvedBusinessViabilityScore >= 75 ? 'high' : ''
                }`}
                style={{ width: `${resolvedBusinessViabilityScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        {/* Radar Chart Section */}
        <div className="p-8 mb-6 bg-white shadow-md rounded-2xl" data-export-section="radar-chart">
          <h2 className="mb-2 text-2xl font-semibold text-slate-800">Performance Comparison</h2>
          <p className="mb-6 text-slate-600">Your idea vs. market average</p>
          <div className="my-4">
            <RadarChart
              data={resolvedRadarData}
              radarConfigs={[
                {
                  name: 'Market Average',
                  dataKey: 'marketAvg',
                  stroke: '#4a90e2',
                  fill: '#4a90e2',
                  fillOpacity: 0.2,
                  strokeWidth: 2,
                },
                {
                  name: 'Your Idea',
                  dataKey: 'userValue',
                  stroke: '#34a83a',
                  fill: '#34a83a',
                  fillOpacity: 0.4,
                  strokeWidth: 2,
                },
              ]}
              height={400}
              showLegend={false}
              showTooltip={true}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-4 h-4 rounded" style={{ background: '#34a83a' }}></div>
              <span>Your Idea</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-4 h-4 rounded" style={{ background: '#4a90e2' }}></div>
              <span>Market Average</span>
            </div>
          </div>
        </div>

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
                    {actualResult.sub_scores?.tech_readiness || 0} / 100
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
                    {actualResult.sub_scores?.infrastructure || 0} / 100
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
                    {actualResult.sub_scores?.market_price || 0} / 100
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
        <div className="database-evidence-card">
          <div className="flex items-center gap-3 pb-3 mb-6 border-b-2 border-slate-200">
            <FileText size={25} />
            <h2 className="m-0 text-2xl font-semibold text-slate-800">Database Evidence</h2>
          </div>
          {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
            <>
              <div className="evidence-cases">
                {actualResult.similar_cases.map((caseItem, index) => {
                  const caseTitle = casesSummaries[index] || `Related Case ${index + 1}`;
                  const { matchPercentage, sourceCaseId, content } = extractCaseInfo(
                    caseItem,
                    index,
                  );

                  // Use structured metadata if available, otherwise parse content
                  const { problem: problemText, solution: solutionText } =
                    extractProblemSolution(caseItem);

                  // Get match strength label
                  const getMatchStrength = (percentage) => {
                    if (percentage >= 80) return { label: 'Excellent Match', color: '#059669' };
                    if (percentage >= 65) return { label: 'Strong Match', color: '#34a83a' };
                    if (percentage >= 50) return { label: 'Decent Match', color: '#65a30d' };
                    return { label: 'Poor Match', color: '#ca8a04' };
                  };

                  const matchStrength = getMatchStrength(matchPercentage);

                  return (
                    <div key={index}>
                      {index > 0 && <div className="mb-6 h-[1.5px] w-[50%] mx-auto bg-slate-300" />}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="flex items-center justify-center gap-2 text-sm py-1 px-2 mt-0.5 text-gray-700 rounded-sm bg-[#f3f4f6] font-semibold">
                          <NotebookText size={16} />
                          <span className="pt-[0.5px]">Source Case {sourceCaseId}</span>
                        </div>
                        <span>&middot;</span>
                        <div className="px-3 py-2 text-xs font-bold text-white rounded-full bg-emerald-600">
                          {matchPercentage}%&nbsp;&nbsp;Similarity
                        </div>
                        <span>&middot;</span>
                        <div
                          className="pt-0.5 text-xs font-bold tracking-wide uppercase text-nowrap"
                          style={{ color: matchStrength.color }}
                        >
                          {matchStrength.label}
                        </div>
                      </div>

                      {/* Visual similarity bar */}
                      <div className="w-full h-1 mb-3 overflow-hidden bg-gray-300 rounded">
                        <div
                          className="h-full transition-all duration-300 rounded"
                          style={{ width: `${matchPercentage}%`, background: matchStrength.color }}
                        ></div>
                      </div>

                      <h3 className="m-0 mb-4 text-base font-semibold leading-relaxed text-gray-900">
                        {caseTitle}
                      </h3>

                      <div className="flex flex-col gap-3">
                        <div className="p-3 border-l-4 rounded bg-gray-50 border-emerald-600">
                          <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
                            <span className="text-sm">🎯</span>
                            <strong>Problem Addressed:</strong>
                          </div>
                          <p className="m-0 text-xs leading-relaxed text-gray-700">
                            {problemText.substring(0, 200)}...
                          </p>
                        </div>
                        <div className="p-3 border-l-4 rounded bg-gray-50 border-emerald-600">
                          <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
                            <span className="text-sm">💡</span>
                            <strong>Solution Approach:</strong>
                          </div>
                          <p className="m-0 text-xs leading-relaxed text-gray-700">
                            {solutionText.substring(0, 200)}...
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start">
                        <button
                          className="mt-3.5 bg-none border-none text-emerald-600 font-semibold cursor-pointer p-2 px-0 text-sm transition-colors hover:text-emerald-700 hover:underline"
                          onClick={() =>
                            setResultsDetailedDatabaseEvidenceModalData({
                              caseItem,
                              content,
                              title: caseTitle,
                              matchPercentage,
                              matchStrength: matchStrength.label,
                              matchColor: matchStrength.color,
                              sourceCaseId,
                            })
                          }
                        >
                          View Full Details →
                        </button>
                        {/* Result Similarity Match Modal */}
                        {resultsDetailedDatabaseEvidenceModalData && (
                          <ResultsDetailedDatabaseEvidenceModal
                            onClose={() => setResultsDetailedDatabaseEvidenceModalData(null)}
                            {...resultsDetailedDatabaseEvidenceModalData}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center text-gray-600">
              <Frown size={40} />
              <p className="">No similar cases were found in the database for this assessment.</p>
            </div>
          )}
        </div>

        {/* Save Assessment Dialog */}
      </div>

      {/* Save Assessment Dialog */}
      <SaveAssessmentDialog
        open={showSaveDialog && !isDetailView}
        onOpenChange={setShowSaveDialog}
        defaultName={defaultAssessmentName}
        onSave={handleSave}
        disabled={isSaving}
      />
    </AppContainer>
  );
}

ResultsPage.propTypes = {
  isDetailView: PropTypes.bool,
};
