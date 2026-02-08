import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppContainer from '@/components/layout/AppContainer';
import { toast } from '@heroui/react';
import RadarChart from '@/components/charts/RadarChart';
import { exportAssessmentCSV, exportAssessmentPDF } from '@/features/export';
import { validKeys, categoryMapping } from '@/constants/evaluationData';
import { categorizeIntegrityGaps, extractCaseInfo, extractProblemSolution } from '@/utils/content';
import { useToast } from '@/hooks/useToast';
import { useExportState } from '@/hooks/useExportState';
import { useSession } from '@/features/session/hooks/useSession';
import { SaveAssessmentDialog } from '@/components/dialogs';
import { CaseSummary } from '@/components/results';
import { titleize } from '@/lib/formatting';
import { useAssessment, useCreateAssessment } from '@/features/assessments';
import { updateAssessment } from '@/features/assessments/api/assessmentApi';
import {
  Card,
  Button,
  Chip,
  Tabs,
  Switch,
  Input,
  Label,
  Accordion,
  ScrollShadow,
} from '@heroui/react';
import {
  BarChart3,
  ClipboardList,
  Target,
  Lightbulb,
  TrendingUp,
  Check,
  ArrowRight,
  Download,
  Link2,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Save,
  Frown,
  NotebookText,
  Lock,
  Globe,
} from 'lucide-react';
import LoaderIcon from '@/components/common/LoaderIcon';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { Dropdown } from '@heroui/react';
import ResultsSkeleton from '@/components/results/ResultsSkeleton';
import useResultsModals from '@/pages/ResultsPage/hooks/useResultsModals';
import ResultsModalManager from '@/components/modals/results/ResultsModalManager';

const fallbackGetRatingBadge = (score) => {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
};

export default function ResultsPage({
  isDetailView = false,
  passedValidKeys,
  passedCategoryMapping,
  getRatingBadge,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationResult = location.state?.result;
  const navigationFormData = location.state?.formData;

  const { addToast } = useToast();
  const { isExporting, executeExport } = useExportState();
  const { saveEvaluation, restoreEvaluation } = useSession();
  const { createAssessmentAsync, isLoading: isSaving } = useCreateAssessment();
  const { modal, isModalOpen, onClose, openDatabaseEvidenceDetailsModal } = useResultsModals();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(() => {
    // Initialize from sessionStorage to persist across page navigations
    return sessionStorage.getItem('sessionRestoredOnce') === 'true';
  });
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);

  useEffect(() => {
    if (!isDetailView && navigationResult) {
      saveEvaluation({ result: navigationResult, formData: navigationFormData });
    }
  }, [navigationResult, navigationFormData, isDetailView, saveEvaluation]);

  // Show info toast if session was restored (only once per browser session)
  useEffect(() => {
    if (!isDetailView && !navigationResult && restoreEvaluation()?.result && !sessionRestored) {
      addToast('Previous session restored.', 'info');
      setSessionRestored(true);
      sessionStorage.setItem('sessionRestoredOnce', 'true');
    }
  }, [isDetailView, navigationResult, restoreEvaluation, sessionRestored, addToast]);

  // Fetch assessment data for detail view using hook
  const { assessment, isLoading, error, refetch } = useAssessment(id, {
    enabled: isDetailView && !!id,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  });

  const fetchedAssessment = assessment;

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

  // Market analysis: route to standalone page
  const handleMarketAnalysis = useCallback(() => {
    if (id) {
      navigate(`/results/${id}/market-analysis`);
    }
  }, [id, navigate]);

  // Smart data resolution: detail view > navigation state > session restoration
  // Memoized to prevent unnecessary re-renders
  const currentData = useMemo(() => {
    if (isDetailView) {
      return detailData;
    }
    return navigationResult || restoreEvaluation()?.result || null;
  }, [isDetailView, detailData, navigationResult, restoreEvaluation]);

  // Save assessment handler
  const handleSave = useCallback(
    async (name, isPublic = true) => {
      try {
        const saveData = {
          name,
          result_json: currentData,
          industry: currentData?.metadata?.industry || 'Unknown',
          is_public: isPublic,
        };

        await createAssessmentAsync(saveData);
        addToast('Assessment saved successfully!', 'success');
        setShowSaveDialog(false);
        // navigate('/assessments');
      } catch (error) {
        console.error('Save error:', error);
        addToast('Failed to save assessment. Please try again.', 'error');
      }
    },
    [currentData, navigationFormData, createAssessmentAsync, addToast, navigate],
  );

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

  const handleShareLink = useCallback(async () => {
    // Check if assessment is saved before allowing share
    if (!isDetailView && !id) {
      toast.danger('Assessment Not Saved', {
        description: 'Please save the assessment first before generating a shareable link.',
        timeout: 4000,
      });
      return;
    }

    const assessmentPath = id ? `/results/${id}` : window.location.pathname;
    const shareUrl = `${window.location.origin}${assessmentPath}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link Copied', {
        description: 'Anyone with this link can now view this assessment.',
        timeout: 3000,
      });
    } catch {
      addToast('Failed to copy link to clipboard', 'error');
    }
  }, [addToast, toast, id, isDetailView]);

  const defaultAssessmentName = useMemo(() => {
    const source = isDetailView ? fetchedAssessment : currentData;
    if (!source) return '';

    const base =
      source.caseName || source.projectTitle || source.metadata?.industry || 'Assessment';

    const date = new Date().toISOString().split('T')[0];
    return `${base} - ${date}`;
  }, [isDetailView, fetchedAssessment, currentData]);

  const handleTogglePublic = async (newValue) => {
    if (!isDetailView || !id) {
      toast.danger('Cannot update sharing settings', {
        description: 'This assessment must be saved first.',
        timeout: 4000,
      });
      return;
    }

    try {
      setIsUpdatingPublic(true);
      await updateAssessment(id, { is_public: newValue });

      // Refetch to get updated data
      await refetch();

      toast.success(newValue ? 'Assessment is now public' : 'Assessment is now private', {
        description: newValue
          ? 'Your assessment can now be viewed via the share link.'
          : 'Your assessment is no longer publicly accessible.',
        timeout: 3000,
      });
    } catch (error) {
      console.error('Failed to update sharing settings:', error);
      toast.danger('Failed to update sharing settings', {
        description: error.message || 'Please try again.',
        timeout: 4000,
      });
    } finally {
      setIsUpdatingPublic(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!currentData?.public_id) {
      toast.danger('Share link unavailable', {
        description: 'This assessment does not have a public ID.',
        timeout: 4000,
      });
      return;
    }

    const shareUrl = `${window.location.origin}/share/${currentData.public_id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard', {
        description: 'Anyone with this link can view your assessment.',
        timeout: 3000,
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.danger('Failed to copy link', {
        description: 'Please try again or copy the link manually: ' + shareUrl,
        timeout: 8000,
      });
    }
  };

  if (detailLoading) {
    return <ResultsSkeleton />;
  }

  if (isDetailView && detailError) {
    return (
      <ErrorDisplay
        variant="error"
        title="Failed to Load Assessment"
        message={detailError || 'Unable to retrieve the assessment details. Please try again.'}
        actions={[
          {
            label: 'Retry',
            icon: RefreshCw,
            onClick: refetch,
            variant: 'secondary',
          },
          {
            label: 'Go Back',
            icon: ArrowLeft,
            onClick: handleBack,
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  if (isDetailView && !currentData) {
    return (
      <ErrorDisplay
        variant="warning"
        title="Assessment Not Found"
        message="The requested assessment could not be found. It may have been deleted or you might not have access to it."
        actions={[
          {
            label: 'Retry Loading',
            icon: RefreshCw,
            onClick: refetch,
            variant: 'secondary',
          },
          {
            label: 'Return Home',
            icon: ArrowLeft,
            onClick: () => navigate('/'),
            variant: 'tertiary',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // If no assessment data found in any source, show error
  if (!currentData) {
    return (
      <ErrorDisplay
        variant="info"
        title="No Assessment Data"
        message="No assessment results are available. Please complete an assessment to see results."
        actions={[
          {
            label: 'Start New Assessment',
            icon: ArrowRight,
            onClick: () => navigate('/'),
            variant: 'secondary',
          },
        ]}
        showDefaultActions={false}
      />
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

  return (
    <>
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 border rounded-lg bg-white">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onPress={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isDetailView ? 'Back to History' : 'Evaluate Another Idea'}
          </Button>
          <Button variant="secondary" onPress={handleViewHistory}>
            <FileText className="w-4 h-4 mr-2" />
            My Assessments
          </Button>
          <Button variant="secondary" onPress={handleMarketAnalysis}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Market Analysis
          </Button>
          {isDetailView && currentData && (
            <Button variant="secondary" onPress={handleReevaluate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-evaluate
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Dropdown>
            <Dropdown.Trigger>
              <Button variant="secondary" isDisabled={isExporting}>
                {isExporting ? (
                  <>
                    <LoaderIcon />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Menu>
              <Dropdown.Item key="pdf" onPress={handleDownloadPDF} isDisabled={isExporting}>
                <FileText className="w-4 h-4 mr-2" />
                Download as PDF
              </Dropdown.Item>
              <Dropdown.Item key="csv" onPress={handleDownloadCSV} isDisabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Similar Cases CSV
              </Dropdown.Item>
              <Dropdown.Item
                key="share"
                onPress={handleShareLink}
                isDisabled={isExporting}
                showDivider
              >
                <Link2 className="w-4 h-4 mr-2" />
                Share Link
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          {!isDetailView && (
            <Button
              onPress={() => setShowSaveDialog(true)}
              isDisabled={isExporting}
              className="bg-primary-500 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Results Content */}
      {/* <ScrollShadow className="h-[calc(100vh-16rem)]"> */}
      <div id="results-content" className="p-8 space-y-6">
        <Tabs defaultSelectedKey="summary" className="space-y-6" orientation="horizontal">
          <Tabs.ListContainer className="flex items-center justify-center">
            <Tabs.List aria-label="Options" className="flex flex-col sm:flex-row sm:w-full w-fit">
              <Tabs.Tab id="summary">
                Summary
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="analysis">
                Detailed Analysis
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="recommendations">
                Recommendations
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="summary" className="space-y-6">
            {/* Executive Summary Card */}
            <Card>
              <div className="px-6 py-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-semibold">Executive Summary</h2>
                      {isDetailView && currentData && (
                        <Chip size="sm" variant="bordered">
                          {currentData.is_public === false ? (
                            <>
                              <Lock className="w-3 h-3" />
                              Private
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3" />
                              Contributing
                            </>
                          )}
                        </Chip>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      AI-powered circularity assessment and recommendations
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    variant={
                      getConfidenceLevel(actualResult.audit?.confidence_score) === 'high'
                        ? 'flat'
                        : getConfidenceLevel(actualResult.audit?.confidence_score) === 'medium'
                          ? 'bordered'
                          : 'bordered'
                    }
                    className="px-2"
                  >
                    {actualResult.audit?.confidence_score || 0}% Confidence
                  </Chip>
                </div>
              </div>
              <div className="px-6 py-6 space-y-6">
                {actualResult.audit?.audit_verdict && (
                  <p className="text-base leading-relaxed text-gray-600">
                    {actualResult.audit.audit_verdict}
                  </p>
                )}
                {actualResult.audit?.comparative_analysis && (
                  <div className="p-4 border-l-4 rounded-r bg-primary/5 border-primary">
                    <p className="mb-1 text-sm font-semibold text-primary">Key Finding</p>
                    <p className="text-sm text-gray-600">
                      {actualResult.audit.comparative_analysis}
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-2 border-primary/20">
                    <div className="px-6 py-6">
                      <p className="mb-1 text-xs font-semibold text-gray-600">Overall Score</p>
                      <p className="text-3xl font-bold text-primary">
                        {overallScore} <span className="text-lg text-gray-600">/ 100</span>
                      </p>
                    </div>
                  </Card>
                  <Card className="border-2 border-blue-200">
                    <div className="px-6 py-6">
                      <p className="mb-1 text-xs font-semibold text-gray-600">
                        Database Cases Analyzed
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {casesSummaries.length || 0}
                      </p>
                    </div>
                  </Card>
                  <Card className="border-2 border-green-200">
                    <div className="px-6 py-6">
                      <p className="mb-1 text-xs font-semibold text-gray-600">
                        Strengths Identified
                      </p>
                      <p className="text-3xl font-bold text-green-600">{strengths.length || 0}</p>
                    </div>
                  </Card>
                  <Card className="border-2 border-orange-200">
                    <div className="px-6 py-6">
                      <p className="mb-1 text-xs font-semibold text-gray-600">Improvement Areas</p>
                      <p className="text-3xl font-bold text-orange-600">{gaps.length || 0}</p>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Share Section */}
            {isDetailView && currentData && (
              <Card>
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Share Assessment
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Make your assessment publicly accessible via a share link
                  </p>
                </div>
                <div className="px-6 py-6 space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="public-toggle" className="font-medium">
                        Public Access
                      </Label>
                      <p className="text-sm text-gray-600">
                        Allow anyone with the link to view this assessment
                      </p>
                    </div>
                    <Switch
                      id="public-toggle"
                      isSelected={currentData.is_public || false}
                      onChange={handleTogglePublic}
                      isDisabled={isUpdatingPublic}
                    />
                  </div>

                  {currentData.is_public && currentData.public_id && (
                    <div className="space-y-3">
                      <Label htmlFor="share-url">Share Link</Label>
                      <div className="flex gap-2">
                        <Input
                          id="share-url"
                          type="text"
                          readOnly
                          value={`${window.location.origin}/share/${currentData.public_id}`}
                          className="flex-1 font-mono text-sm"
                        />
                        <Button variant="secondary" onPress={handleCopyShareLink} className="gap-2">
                          <Link2 className="w-4 h-4" />
                          Copy Link
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Anyone with this link can view your assessment results, but cannot edit or
                        delete it.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Case Summary */}
            <div data-export-section="case-summary">
              <CaseSummary
                caseInfo={extractCaseInfo(currentData)}
                problemSolution={extractProblemSolution(currentData)}
              />
            </div>

            {/* Score Highlights */}
            <Card>
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Score Highlights</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Key performance indicators across circular economy factors
                </p>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card className="border-green-200 bg-green-50">
                    <div className="px-6 py-6">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-bold tracking-wide text-green-800 uppercase">
                          Strongest Factor
                        </p>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-green-900">
                        {topFactor ? titleize(topFactor[0]) : 'Not available'}
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        {topFactor ? `${topFactor[1]} / 100` : 'Awaiting data'}
                      </p>
                    </div>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50">
                    <div className="px-6 py-6">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-bold tracking-wide text-orange-800 uppercase">
                          Focus Area
                        </p>
                        <Target className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-lg font-bold text-orange-900">
                        {focusFactor ? titleize(focusFactor[0]) : 'Not available'}
                      </p>
                      <p className="mt-1 text-sm text-orange-700">
                        {focusFactor ? `${focusFactor[1]} / 100` : 'Awaiting data'}
                      </p>
                    </div>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <div className="px-6 py-6">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-bold tracking-wide text-blue-800 uppercase">
                          Average Factor Score
                        </p>
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-lg font-bold text-blue-900">
                        {avgFactorScore || 'Not available'} <span className="text-sm">/ 100</span>
                      </p>
                      <p className="mt-1 text-sm text-blue-700">
                        Business Viability: {resolvedBusinessViabilityScore || 'N/A'} / 100
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Quick Tips for New Users */}
            <Card className="border-2 border-blue-300 border-dashed bg-blue-50/50">
              <div className="px-6 py-4 border-b">
                <h3 className="flex items-center gap-2 text-blue-900 font-semibold">
                  <Lightbulb className="w-5 h-5 text-blue-700" />
                  How to Use This Report
                </h3>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">Your Score</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      The overall circularity rating out of 100. Compare this with similar projects
                      to identify your competitive position.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-semibold text-blue-900">Strengths</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      Areas where your initiative excels. Leverage these as competitive advantages
                      and marketing points.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      <p className="text-sm font-semibold text-blue-900">Focus Areas</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      Priority improvements that could boost your score. Start with high-impact,
                      low-effort changes first.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-semibold text-blue-900">Benchmarking</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      See how you compare to similar projects. Use this to set realistic improvement
                      targets.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">Export Options</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      Save this assessment and download a PDF report to share with stakeholders or
                      track changes over time.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-blue-900">Next Steps</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      Address the identified improvement areas and reassess after implementing
                      changes to track progress.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Audit Verdict */}
            {actualResult.audit?.audit_verdict && (
              <div className="verdict-card prominent">
                <h2>Auditor&apos;s Verdict</h2>
                <p className="verdict-text">{actualResult.audit.audit_verdict}</p>
              </div>
            )}

            {/* Gap Analysis & Benchmarks Section */}
            {actualResult.gap_analysis?.has_benchmarks && (
              <div className="bg-[#f0f4f8] p-8 rounded-xl mb-8 border-2 border-[#4a90e2]">
                <h2 className="m-0 mb-6 text-[#2c3e50] flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[#4a90e2]" strokeWidth={2.5} /> Your
                  Performance vs. Similar Projects
                </h2>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="mb-2 text-sm text-gray-600">Your Score</div>
                    <div className="text-2xl font-bold text-[#34a83a]">
                      {actualResult.overall_score}
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="mb-2 text-sm text-gray-600">Similar Projects Average</div>
                    <div className="text-2xl font-bold text-[#4a90e2]">
                      {Math.round(actualResult.gap_analysis.overall_benchmarks.average)}
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="mb-2 text-sm text-gray-600">Top 10% Threshold</div>
                    <div className="text-2xl font-bold text-[#9c27b0]">
                      {actualResult.gap_analysis.overall_benchmarks.top_10_percentile}
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="mb-2 text-sm text-gray-600">Median</div>
                    <div className="text-2xl font-bold text-[#26a69a]">
                      {actualResult.gap_analysis.overall_benchmarks.median}
                    </div>
                  </div>
                </div>

                {Object.keys(actualResult.gap_analysis.sub_score_gaps).length > 0 && (
                  <div>
                    <h3 className="my-6 mb-4 text-[#2c3e50]">Factor-by-Factor Analysis</h3>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                      {Object.entries(actualResult.gap_analysis.sub_score_gaps).map(
                        ([factor, gap]) => (
                          <div
                            key={factor}
                            className="p-4 bg-white rounded-lg"
                            style={{
                              borderLeft: gap.gap > 5 ? '4px solid #ff9800' : '4px solid #4caf50',
                            }}
                          >
                            <div className="text-sm font-bold text-[#2c3e50] mb-2">
                              {factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                            <div className="flex justify-between mb-2">
                              <div>
                                <span className="text-xs text-gray-600">Your Score:</span>
                                <div className="text-xl font-bold text-[#34a83a]">
                                  {gap.user_score}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Benchmark:</span>
                                <div className="text-xl font-bold text-[#4a90e2]">
                                  {gap.benchmark_average}
                                </div>
                              </div>
                            </div>
                            {gap.gap > 0 ? (
                              <div className="text-[0.85rem] text-[#ff9800] font-bold flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-[#ff9800]" strokeWidth={2.5} />{' '}
                                Opportunity: +{gap.gap} points possible
                              </div>
                            ) : (
                              <div className="text-[0.85rem] text-[#4caf50] font-bold flex items-center gap-1">
                                <Check className="w-4 h-4 text-[#4caf50]" strokeWidth={2.5} /> Above
                                benchmark by {Math.abs(gap.gap)} points
                              </div>
                            )}
                            <div className="mt-2 text-xs text-gray-400">
                              {gap.percentile}th percentile vs. similar projects
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Industry & Metadata Section */}
            {actualResult.metadata && (
              <div className="bg-[#e8f5e9] p-6 rounded-[10px] mb-8 border-2 border-[#34a83a]">
                <h3 className="m-0 mb-4 text-[#2d5f2e] flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#34a83a]" strokeWidth={2.5} /> Project
                  Classification
                </h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                  <div className="bg-white p-4 rounded-lg border border-[#c8e6c9]">
                    <div
                      className="text-xs font-bold text-[#2d5f2e] uppercase tracking-wide"
                      title={fieldHelp.industry}
                    >
                      Industry
                    </div>
                    <div className="text-xl text-[#1b5e20] mt-1 font-bold">
                      {titleize(actualResult.metadata.industry)}
                    </div>
                    <div className="text-[0.78rem] text-[#2d5f2e99] mt-1 italic">
                      {fieldHelp.industry}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#c8e6c9]">
                    <div
                      className="text-xs font-bold text-[#2d5f2e] uppercase tracking-wide"
                      title={fieldHelp.scale}
                    >
                      Scale
                    </div>
                    <div className="text-xl text-[#1b5e20] mt-1 font-bold">
                      {titleize(actualResult.metadata.scale)}
                    </div>
                    <div className="text-[0.78rem] text-[#2d5f2e99] mt-1 italic">
                      {fieldHelp.scale}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#c8e6c9]">
                    <div
                      className="text-xs font-bold text-[#2d5f2e] uppercase tracking-wide"
                      title={fieldHelp.r_strategy}
                    >
                      Circular Strategy
                    </div>
                    <div className="text-xl text-[#1b5e20] mt-1 font-bold">
                      {titleize(actualResult.metadata.r_strategy)}
                    </div>
                    <div className="text-[0.78rem] text-[#2d5f2e99] mt-1 italic">
                      {fieldHelp.r_strategy}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#c8e6c9]">
                    <div
                      className="text-xs font-bold text-[#2d5f2e] uppercase tracking-wide"
                      title={fieldHelp.primary_material}
                    >
                      Material Focus
                    </div>
                    <div className="text-xl text-[#1b5e20] mt-1 font-bold">
                      {titleize(actualResult.metadata.primary_material)}
                    </div>
                    <div className="text-[0.78rem] text-[#2d5f2e99] mt-1 italic">
                      {fieldHelp.primary_material}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#c8e6c9]">
                    <div
                      className="text-xs font-bold text-[#2d5f2e] uppercase tracking-wide"
                      title={fieldHelp.geographic_focus}
                    >
                      Geographic Focus
                    </div>
                    <div className="text-xl text-[#1b5e20] mt-1 font-bold">
                      {titleize(actualResult.metadata.geographic_focus)}
                    </div>
                    <div className="text-[0.78rem] text-[#2d5f2e99] mt-1 italic">
                      {fieldHelp.geographic_focus}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrity Analysis Section */}
            {(gaps.length > 0 || strengths.length > 0) && (
              <Card>
                <Card.Header>
                  <Card.Title>Integrity Analysis</Card.Title>
                  <Card.Description>
                    We compare your self-assessed scores against real-world projects in our database
                    to identify potential overestimations or underestimations.
                  </Card.Description>
                </Card.Header>
                <Card.Description>
                  <Accordion type="single" collapsible className="w-full">
                    {/* Strengths */}
                    {strengths.length > 0 && (
                      <Accordion.Item value="strengths">
                        <Accordion.Trigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold">Strengths Validated</span>
                            <Chip variant="secondary" color="success" className="ml-2">
                              <Chip.Label>{strengths.length}</Chip.Label>
                            </Chip>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Body>
                          <div className="pt-2 space-y-3">
                            {strengths.map((strength, i) => (
                              <div
                                key={i}
                                className="flex gap-3 p-3 border border-green-200 rounded-lg bg-green-50"
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-900">
                                    {strength.issue || strength}
                                  </p>
                                  {strength.evidence_source_id && (
                                    <Chip
                                      variant="tertiary"
                                      color="default"
                                      size="sm"
                                      className="mt-2"
                                    >
                                      <Chip.Label>
                                        Validated by Case #{strength.evidence_source_id}
                                      </Chip.Label>
                                    </Chip>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    )}

                    {/* Gaps/Issues */}
                    {gaps.length > 0 && (
                      <Accordion.Item value="gaps">
                        <Accordion.Trigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <span className="font-semibold">Areas for Improvement</span>
                            <Chip variant="secondary" color="warning" className="ml-2">
                              <Chip.Label>{gaps.length}</Chip.Label>
                            </Chip>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Body>
                          <div className="pt-2 space-y-3">
                            {gaps.map((gap, i) => {
                              const severity = gap.severity || 'medium';
                              const severityColors = {
                                high: 'bg-red-50 border-red-300',
                                medium: 'bg-orange-50 border-orange-300',
                                low: 'bg-yellow-50 border-yellow-300',
                              };
                              const severityChip = {
                                high: 'danger',
                                medium: 'warning',
                                low: 'default',
                              };
                              return (
                                <div
                                  key={i}
                                  className={`flex gap-3 p-3 rounded-lg border ${severityColors[severity]}`}
                                >
                                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                      {(gap.issue || gap).replace(/_/g, ' ')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Chip
                                        color={severityChip[severity]}
                                        variant="secondary"
                                        size="sm"
                                      >
                                        <Chip.Label>
                                          {severity.charAt(0).toUpperCase() + severity.slice(1)}{' '}
                                          severity
                                        </Chip.Label>
                                      </Chip>
                                      {gap.evidence_source_id && (
                                        <Chip variant="tertiary" color="default" size="sm">
                                          <Chip.Label>Case #{gap.evidence_source_id}</Chip.Label>
                                        </Chip>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    )}
                  </Accordion>
                </Card.Description>
              </Card>
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
            <div
              className="p-8 mb-6 bg-white shadow-md rounded-2xl"
              data-export-section="radar-chart"
            >
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
                  <div className="w-4 h-4 rounded bg-[#34a83a]"></div>
                  <span>Your Idea</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <div className="w-4 h-4 rounded bg-[#4a90e2]"></div>
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
          </Tabs.Panel>

          <Tabs.Panel id="analysis" className="space-y-6">
            {/* Integrity Analysis Section */}
            {(gaps.length > 0 || strengths.length > 0) && (
              <Card>
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Integrity Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We compare your self-assessed scores against real-world projects in our database
                    to identify potential overestimations or underestimations.
                  </p>
                </div>
                <div className="px-6 py-6">
                  <Accordion type="single" collapsible className="w-full">
                    {/* Strengths */}
                    {strengths.length > 0 && (
                      <Accordion.Item value="strengths">
                        <Accordion.Trigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold">Strengths Validated</span>
                            <Chip size="sm" color="secondary" className="ml-2">
                              {strengths.length}
                            </Chip>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Body>
                          <div className="pt-2 space-y-3">
                            {strengths.map((strength, i) => (
                              <div
                                key={i}
                                className="flex gap-3 p-3 border border-green-200 rounded-lg bg-green-50"
                              >
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-900">
                                    {strength.issue || strength}
                                  </p>
                                  {strength.evidence_source_id && (
                                    <Chip size="sm" variant="bordered" className="mt-2 text-xs">
                                      Validated by Case #{strength.evidence_source_id}
                                    </Chip>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    )}

                    {/* Gaps/Issues */}
                    {gaps.length > 0 && (
                      <Accordion.Item value="gaps">
                        <Accordion.Trigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <span className="font-semibold">Areas for Improvement</span>
                            <Chip variant="secondary" color="warning" className="ml-2">
                              <Chip.Label>{gaps.length}</Chip.Label>
                            </Chip>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Body>
                          <div className="pt-2 space-y-3">
                            {gaps.map((gap, i) => {
                              const severity = gap.severity || 'medium';
                              const severityColors = {
                                high: 'bg-red-50 border-red-300',
                                medium: 'bg-orange-50 border-orange-300',
                                low: 'bg-yellow-50 border-yellow-300',
                              };
                              const severityChip = {
                                high: 'danger',
                                medium: 'warning',
                                low: 'default',
                              };
                              return (
                                <div
                                  key={i}
                                  className={`flex gap-3 p-3 rounded-lg border ${severityColors[severity]}`}
                                >
                                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                      {(gap.issue || gap).replace(/_/g, ' ')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Chip
                                        color={severityChip[severity]}
                                        variant="secondary"
                                        size="sm"
                                      >
                                        <Chip.Label>
                                          {severity.charAt(0).toUpperCase() + severity.slice(1)}{' '}
                                          severity
                                        </Chip.Label>
                                      </Chip>
                                      {gap.evidence_source_id && (
                                        <Chip variant="tertiary" color="default" size="sm">
                                          <Chip.Label>Case #{gap.evidence_source_id}</Chip.Label>
                                        </Chip>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    )}
                  </Accordion>
                </div>
              </Card>
            )}

            {/* Database Evidence Section */}
            <Card data-export-section="database-evidence">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <FileText size={22} />
                  <div>
                    <h3 className="text-lg font-semibold">Database Evidence</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Similar cases and benchmark comparisons from the dataset
                    </p>
                  </div>
                </div>
              </div>
              <Card.Description>
                {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
                  <div className="evidence-cases">
                    {actualResult.similar_cases.map((caseItem, index) => {
                      const caseTitle = casesSummaries[index] || `Related Case ${index + 1}`;
                      const { matchPercentage, sourceCaseId, content } = extractCaseInfo(
                        caseItem,
                        index,
                      );

                      const { problem: problemText, solution: solutionText } =
                        extractProblemSolution(caseItem);

                      const getMatchStrength = (percentage) => {
                        if (percentage >= 80) return { label: 'Excellent Match', color: '#059669' };
                        if (percentage >= 65) return { label: 'Strong Match', color: '#34a83a' };
                        if (percentage >= 50) return { label: 'Decent Match', color: '#65a30d' };
                        return { label: 'Poor Match', color: '#ca8a04' };
                      };

                      const matchStrength = getMatchStrength(matchPercentage);

                      return (
                        <div key={index}>
                          {index > 0 && (
                            <div className="mb-6 h-[1.5px] w-[50%] mx-auto bg-slate-300" />
                          )}
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

                          <div className="w-full h-1 mb-3 overflow-hidden bg-gray-300 rounded">
                            <div
                              className="h-full transition-all duration-300 rounded"
                              style={{
                                width: `${matchPercentage}%`,
                                background: matchStrength.color,
                              }}
                            ></div>
                          </div>

                          <h3 className="m-0 mb-4 text-base font-semibold leading-relaxed text-gray-900">
                            {caseTitle}
                          </h3>

                          <div className="flex flex-col gap-3">
                            <div className="p-3 border-l-4 rounded bg-gray-50 border-emerald-600">
                              <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
                                <Target className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                                <strong>Problem Addressed:</strong>
                              </div>
                              <p className="m-0 text-xs leading-relaxed text-gray-700">
                                {problemText.substring(0, 200)}...
                              </p>
                            </div>
                            <div className="p-3 border-l-4 rounded bg-gray-50 border-emerald-600">
                              <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
                                <Lightbulb className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                                <strong>Solution Approach:</strong>
                              </div>
                              <p className="m-0 text-xs leading-relaxed text-gray-700">
                                {solutionText.substring(0, 200)}...
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-center sm:justify-start">
                            <button
                              className="mt-3.5 bg-none border-none text-emerald-600 font-semibold cursor-pointer p-2 px-0 text-sm transition-colors hover:text-emerald-700 hover:underline flex items-center gap-1"
                              onClick={() =>
                                openDatabaseEvidenceDetailsModal({
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
                              View Full Details{' '}
                              <ArrowRight className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center text-gray-600">
                    <Frown size={40} />
                    <p className="">
                      No similar cases were found in the database for this assessment.
                    </p>
                  </div>
                )}
              </Card.Description>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel id="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Strengths & Gaps</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Highlights from your assessment and improvement areas
                  </p>
                </div>
                <div className="px-6 py-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-semibold text-slate-900">Strengths</p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {strengths.length > 0 ? (
                        strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span>•</span>
                            <span>
                              {strength.issue || strength}
                              {strength.evidence_source_id && (
                                <Chip size="sm" variant="bordered" className="ml-2 text-xs">
                                  Case #{strength.evidence_source_id}
                                </Chip>
                              )}
                            </span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li>Strong focus on material reuse and recycling</li>
                          <li>Clear value proposition for sustainability</li>
                          <li>Potential for scalable implementation</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {gaps.length > 0 && (
                    <div>
                      <div className="w-full h-px bg-gray-200 my-4" />
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <p className="text-sm font-semibold text-slate-900">Gaps</p>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {gaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span>•</span>
                            <span>
                              {gap.issue || gap}
                              {gap.evidence_source_id && (
                                <Chip size="sm" variant="bordered" className="ml-2 text-xs">
                                  Case #{gap.evidence_source_id}
                                </Chip>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Recommendations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Targeted steps to improve your circularity score
                  </p>
                </div>
                <div className="px-6 py-6">
                  <ul className="space-y-2 text-sm text-gray-600">
                    {actualResult.audit?.technical_recommendations?.length > 0 ? (
                      actualResult.audit.technical_recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li>Consider incorporating predictive maintenance strategies</li>
                        <li>Explore partnerships with recycling facilities</li>
                        <li>Develop metrics for tracking circularity performance</li>
                      </>
                    )}
                  </ul>
                </div>
              </Card>
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
      {/* </ScrollShadow> */}

      {/* Save Assessment Dialog */}
      <SaveAssessmentDialog
        isOpen={showSaveDialog && !isDetailView}
        onOpenChange={setShowSaveDialog}
        defaultName={defaultAssessmentName}
        onSave={handleSave}
      />

      {/* Results Page Modals */}
      <ResultsModalManager modal={modal} isModalOpen={isModalOpen} onClose={onClose} />
    </>
  );
}

ResultsPage.propTypes = {
  isDetailView: PropTypes.bool,
  passedValidKeys: PropTypes.arrayOf(PropTypes.string),
  passedCategoryMapping: PropTypes.object,
  getRatingBadge: PropTypes.func,
};
