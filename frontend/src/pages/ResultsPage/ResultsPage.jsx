import {
  Accordion,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Tabs,
  toast,
  Tooltip,
} from '@heroui/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleX,
  ClipboardList,
  Download,
  FileText,
  FolderPen,
  Globe,
  Lightbulb,
  Link2,
  MonitorDown,
  RefreshCw,
  Save,
  Target,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import RadarChart from '@/components/charts/RadarChart';
import { Button, Switch } from '@/components/common';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import CopyButton from '@/components/modern-ui/copy-button';
import { categoryMapping, parameterLabels, validKeys } from '@/constants/evaluationData';
import { useGlobalDialog } from '@/contexts/DialogContext';
import {
  deleteAssessment,
  getAssessments,
  updateAssessment,
} from '@/features/assessments/api/assessmentApi';
import {
  useAssessment,
  useCreateAssessment,
  usePublicAssessment,
} from '@/features/assessments/hooks/useAssessment';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportAssessmentCSV, exportAssessmentPDF } from '@/features/export';
import { useSession } from '@/features/session/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { useExportState } from '@/hooks/useExportState';
import { titleize } from '@/lib/formatting';
import { formatFactorName } from '@/lib/scoring';
import { categorizeIntegrityGaps, extractProblemSolution } from '@/utils/content';
import { getSession, saveSession } from '@/utils/session';

import {
  AuditSummaryCard,
  CircularEconomyTierCard,
  DatabaseEvidenceCard,
  GapAnalysisCard,
  ParameterConsistencyCard,
  ResultsSkeleton,
  RStrategyAlignmentCard,
  ScoreCategoryBreakdown,
  ScoreOverviewSection,
  WeightedScoreCard,
} from './components';

export default function ResultsPage({ isViewFromMyAssessments = false, isPublicShare = false }) {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isResultsRoute = location.pathname.startsWith('/results');
  const navigationResult = location.state?.result;
  const navigationFormData = location.state?.formData;
  const isRestored = location.state?.isRestored || false;

  const { isExporting, executeExport } = useExportState();
  const { restoreEvaluation } = useSession();
  const { createAssessmentAsync } = useCreateAssessment();

  const reportTips = useMemo(
    () => [
      {
        title: 'Your Score',
        description:
          'The overall circularity rating out of 100. Compare this with similar projects to identify your competitive position.',
        Icon: BarChart3,
        iconClassName: 'text-blue-600',
      },
      {
        title: 'Strengths',
        description:
          'Areas where your initiative excels. Leverage these as competitive advantages and marketing points.',
        Icon: CheckCircle2,
        iconClassName: 'text-green-600',
      },
      {
        title: 'Focus Areas',
        description:
          'Priority improvements that could boost your score. Start with high-impact, low-effort changes first.',
        Icon: Target,
        iconClassName: 'text-orange-600',
      },
      {
        title: 'Benchmarking',
        description:
          'See how you compare to similar projects. Use this to set realistic improvement targets.',
        Icon: TrendingUp,
        iconClassName: 'text-purple-600',
      },
      {
        title: 'Export Options',
        description:
          'Save this assessment and download a PDF report to share with stakeholders or track changes over time.',
        Icon: Download,
        iconClassName: 'text-blue-600',
      },
      {
        title: 'Next Steps',
        description:
          'Address the identified improvement areas and reassess after implementing changes to track progress.',
        Icon: RefreshCw,
        iconClassName: 'text-emerald-600',
      },
    ],
    [],
  );

  const [selectedTab, setSelectedTab] = useState('summary');
  const [sessionRestored, setSessionRestored] = useState(() => {
    // Initialize from sessionStorage to persist across page navigations
    return sessionStorage.getItem('sessionRestoredOnce') === 'true';
  });
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);
  const [optimisticIsPublic, setOptimisticIsPublic] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { openSaveAssessmentDialog, openRenameAssessmentDialog, openDeleteAssessmentDialog } =
    useGlobalDialog();

  // Show info toast if session was restored (only once per browser session)
  useEffect(() => {
    if (
      !isViewFromMyAssessments &&
      !navigationResult &&
      restoreEvaluation()?.result &&
      !sessionRestored
    ) {
      toast.info('Previous session restored.', { timeout: 3000 });
      setSessionRestored(true);
      sessionStorage.setItem('sessionRestoredOnce', 'true');
    }
  }, [isViewFromMyAssessments, navigationResult, restoreEvaluation, sessionRestored]);

  // Fetch assessment data - use public endpoint for shared assessments
  const {
    assessment: privateAssessment,
    isLoading: privateLoading,
    error: privateError,
    refetch: privateRefetch,
  } = useAssessment(publicId, {
    enabled: isViewFromMyAssessments && !isPublicShare && !!publicId,
    placeholderData: (previousData) => previousData,
  });

  const {
    assessment: publicAssessment,
    isLoading: publicLoading,
    error: publicError,
    refetch: publicRefetch,
  } = usePublicAssessment(publicId, {
    enabled: isPublicShare && !!publicId,
  });

  // Use appropriate data source based on view type
  const fetchedAssessment = isPublicShare ? publicAssessment : privateAssessment;
  const id = fetchedAssessment?.id;
  const refetch = isPublicShare ? publicRefetch : privateRefetch;

  const detailLoading = isPublicShare ? publicLoading : privateLoading;
  const detailError = isPublicShare ? publicError : privateError;
  const detailData = fetchedAssessment;

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (isViewFromMyAssessments) {
      navigate('/assessments');
    } else {
      navigate('/');
    }
  }, [isViewFromMyAssessments, navigate]);

  const handleViewHistory = useCallback(() => {
    navigate('/assessments');
  }, [navigate]);

  // Market analysis navigation:
  // - Saved assessment view  -> `/assessments/:publicId/market-analysis` (protected)
  // - Unsaved/session result -> `/results/market-analysis` (public, uses session_evaluation_state.results)
  // NOTE: avoid referencing `currentData` here because it is declared later.
  const handleMarketAnalysis = useCallback(() => {
    // Treat as saved when viewing from My Assessments or when URL provides a publicId
    if (isViewFromMyAssessments || publicId) {
      if (publicId) navigate(`/assessments/${publicId}/market-analysis`);
      return;
    }

    // Otherwise use the session-based Market Analysis for unsaved results
    navigate('/results/market-analysis');
  }, [isViewFromMyAssessments, publicId, navigate]);

  const sessionSnapshot = useMemo(() => {
    if (isViewFromMyAssessments) return null;
    return restoreEvaluation();
  }, [isViewFromMyAssessments, restoreEvaluation]);

  // Smart data resolution: detail view > navigation state > session restoration
  // Memoized to prevent unnecessary re-renders
  const currentData = useMemo(() => {
    if (isViewFromMyAssessments) {
      return detailData;
    }
    return navigationResult || sessionSnapshot?.results || null;
  }, [isViewFromMyAssessments, detailData, navigationResult, sessionSnapshot]);

  const resolvedFormData = useMemo(() => {
    if (isViewFromMyAssessments) return null;
    return navigationFormData || sessionSnapshot?.formData || null;
  }, [isViewFromMyAssessments, navigationFormData, sessionSnapshot]);

  // Save complete results to session (including inputs that generated the result).
  // IMPORTANT: results are a snapshot and MUST remain exactly as they were when
  // calculated. Do NOT overwrite session inputs unless the navigation provided
  // formData (`resolvedFormData`) — inputs are intentionally independent.
  useEffect(() => {
    if (isViewFromMyAssessments || isPublicShare) return;

    const resultData = navigationResult || navigationResult?.result;
    if (!resultData) return;

    try {
      // Prefer the explicit form data when available (navigation state), else
      // fall back to the inputs embedded in the returned result (server now
      // echoes `businessProblem` / `businessSolution` / `parameters`).
      const snapshotInputs = {
        businessProblem:
          resolvedFormData?.businessProblem ??
          resultData.businessProblem ??
          resultData.problem ??
          '',
        businessSolution:
          resolvedFormData?.businessSolution ??
          resultData.businessSolution ??
          resultData.solution ??
          '',
        evaluationParameters:
          resolvedFormData?.evaluation_parameters ?? resultData.evaluation_parameters ?? {},
        businessContext: resolvedFormData?.businessContext ?? resultData.business_context ?? {},
      };

      const stateToSave = {
        // Only update `inputs` when we actually have form data from navigation.
        // This preserves `session_evaluation_state.inputs` for other flows.
        ...(resolvedFormData ? { inputs: { ...snapshotInputs } } : {}),
        results: {
          // Embed the snapshot inputs inside results so the snapshot is self-contained
          businessProblem: snapshotInputs.businessProblem,
          businessSolution: snapshotInputs.businessSolution,
          evaluationParameters: snapshotInputs.evaluationParameters,
          businessContext: snapshotInputs.businessContext,
          ...resultData,
        },
      };

      saveSession(stateToSave);
    } catch (e) {
      logger.error('Failed to save results to session:', e);
    }
  }, [navigationResult, isViewFromMyAssessments, isPublicShare, saveSession, resolvedFormData]);

  // Helper: normalize result_json before sending to the API so server-side
  // validation never receives null/incorrect primitive types for well-known
  // fields like `similar_cases` (defensive hardening).
  function normalizeResultForSave(raw) {
    if (!raw || typeof raw !== 'object') return raw || {};

    const out = { ...raw };

    // Ensure similar_cases is an array of plain objects with correct primitive types
    if (Array.isArray(out.similar_cases)) {
      out.similar_cases = out.similar_cases.map((item) => {
        const ci = item || {};
        return {
          case_id: ci.case_id != null ? String(ci.case_id) : undefined,
          title: ci.title == null ? '' : String(ci.title),
          problem: ci.problem == null ? '' : String(ci.problem),
          solution: ci.solution == null ? '' : String(ci.solution),
          similarity:
            typeof ci.similarity === 'number' && !Number.isNaN(ci.similarity)
              ? ci.similarity
              : Number(ci.similarity) || 0,
          // preserve any additional fields but do not allow functions
          ...(typeof ci === 'object'
            ? Object.keys(ci).reduce((acc, k) => {
                if (['case_id', 'title', 'problem', 'solution', 'similarity'].includes(k))
                  return acc;
                const v = ci[k];
                if (typeof v !== 'function') acc[k] = v;
                return acc;
              }, {})
            : {}),
        };
      });
    }

    // Ensure metadata is a plain object if present, but do not mutate industry/region
    if (out.metadata && typeof out.metadata === 'object') {
      out.metadata = { ...out.metadata };
    }

    return out;
  }

  // Save assessment handler
  const handleSave = useCallback(
    async ({
      name,
      industry,
      isPublic = true,
      contributeToGlobalBenchmarks = true,
      scoringResult,
    }) => {
      try {
        const baseResult = scoringResult || currentData?.result_json || currentData || {};
        const inputParameters =
          resolvedFormData?.evaluation_parameters || baseResult?.evaluation_parameters || null;
        let resultPayload = inputParameters
          ? { ...baseResult, evaluation_parameters: inputParameters }
          : baseResult;

        // Defensive normalization to avoid backend validation failures
        resultPayload = normalizeResultForSave(resultPayload);

        const resolvedIndustry =
          (industry && industry.trim()) ||
          currentData?.industry ||
          resultPayload?.metadata?.industry ||
          resultPayload?.industry ||
          'Unknown';

        if (
          !resultPayload ||
          (typeof resultPayload === 'object' && !Object.keys(resultPayload).length)
        ) {
          throw new Error(
            'Cannot save assessment: result_json is empty. Please re-run evaluation before saving.',
          );
        }

        const saveData = {
          name,
          result_json: resultPayload,
          industry: resolvedIndustry,
          is_public: isPublic,
          contribute_to_global_benchmarks: contributeToGlobalBenchmarks,
          // Persist case-summary fields — prefer `resolvedFormData` (from in-memory form)
          // but fall back to the calculated snapshot embedded in `currentData` (saved
          // assessments use `result_json` or `business_problem` fields).
          businessProblem:
            resolvedFormData?.businessProblem ||
            (resultPayload && (resultPayload.businessProblem || resultPayload.problem)) ||
            currentData?.business_problem ||
            '',
          businessSolution:
            resolvedFormData?.businessSolution ||
            (resultPayload && (resultPayload.businessSolution || resultPayload.solution)) ||
            currentData?.business_solution ||
            '',
          parameters:
            // Prefer resolved form inputs, then any parameters embedded in the
            // result payload (server returns `evaluation_parameters`),
            // then fall back to top-level `currentData` parameters.
            resolvedFormData?.evaluation_parameters ||
            resultPayload?.evaluation_parameters ||
            currentData?.evaluation_parameters ||
            undefined,
        };

        // Prevent duplicate assessment names for this user
        try {
          const existing = await getAssessments({ search: name, pageSize: 100 });
          const duplicate = Array.isArray(existing?.assessments)
            ? existing.assessments.find(
                (a) =>
                  a.title && a.title.trim().toLowerCase() === String(name).trim().toLowerCase(),
              )
            : null;
          if (duplicate) {
            throw new Error('You already have an assessment with that name');
          }
        } catch (errCheck) {
          // If the check itself failed due to network/auth, allow create to proceed
          if (errCheck.message === 'You already have an assessment with that name') throw errCheck;
          logger.warn('Duplicate name check failed, proceeding to create:', errCheck?.message);
        }

        const result = await createAssessmentAsync(saveData);
        toast.success('Assessment saved successfully! Redirecting...', { timeout: 3000 });

        // After successful save, clear only the results from local evaluation state but keep inputs
        try {
          const currentState = getSession();

          saveSession({
            inputs: currentState?.inputs || {
              businessProblem: resolvedFormData?.businessProblem || '',
              businessSolution: resolvedFormData?.businessSolution || '',
              evaluationParameters: resolvedFormData?.evaluationParameters || {},
              businessContext: resolvedFormData?.businessContext || {},
            },
            results: null, // Clear results
          });
        } catch (e) {
          logger.warn('Failed to update session after save:', e);
        }

        // Redirect to the saved assessment if id available, otherwise list
        const newId = result?.id || result?.assessment?.id;
        if (newId) {
          // Give a brief moment for cache invalidation, then navigate to the detail
          setTimeout(() => navigate(`/assessments/${newId}`), 800);
        } else {
          setTimeout(() => navigate('/assessments'), 800);
        }
      } catch (error) {
        logger.warn('Save error:', error);
        // Rethrow so callers (SaveAssessmentDialog) can display the error in-dialog
        throw error;
      }
    },
    [currentData, resolvedFormData, createAssessmentAsync, navigate],
  );

  const scoringResult = useMemo(() => {
    if (!currentData) return null;
    if (currentData.result_json) return currentData.result_json;
    // If the payload already looks like a scoring API response, use it directly
    if (currentData.businessProblem || currentData.businessSolution) return currentData;

    // Otherwise, reconstruct from the saved assessment row
    return reconstructScoringResult(currentData);
  }, [currentData]);

  const actualResult = scoringResult || currentData || null;
  const caseId = actualResult?.case_id || currentData?.id || id;
  let caseIndustry = '';
  try {
    const { getIndustry } = require('@/lib/metadata');
    caseIndustry = getIndustry(actualResult) || '';
  } catch (e) {
    caseIndustry = actualResult?.industry || actualResult?.metadata?.industry || '';
  }
  const caseProblemSolution = useMemo(
    () => extractProblemSolution(actualResult || currentData || {}),
    [actualResult, currentData],
  );

  // When results are restored via session restore, always use the snapshot in results for Case Summary
  let problemText, solutionText, businessContextValues, evaluationParameterValues;

  if (!isViewFromMyAssessments && sessionSnapshot?.results) {
    // Use the snapshot from session results (calculated, not editable)
    const res = sessionSnapshot.results;
    problemText =
      res.businessProblem ||
      res.problem ||
      res.audit?.businessProblem ||
      caseProblemSolution?.problem ||
      'Problem data unavailable';
    solutionText =
      res.businessSolution ||
      res.solution ||
      res.audit?.businessSolution ||
      caseProblemSolution?.solution ||
      'Solution data unavailable';
    evaluationParameterValues = res.evaluation_parameters || null;
    businessContextValues = res.business_context || null;
  } else {
    // Fallback to previous logic for saved assessments or navigation
    const storedProblemText =
      isRestored && navigationFormData
        ? navigationFormData.businessProblem
        : isViewFromMyAssessments
          ? currentData?.business_problem
          : resolvedFormData?.businessProblem;
    const storedSolutionText =
      isRestored && navigationFormData
        ? navigationFormData.businessSolution
        : isViewFromMyAssessments
          ? currentData?.business_solution
          : resolvedFormData?.businessSolution;
    problemText = storedProblemText || caseProblemSolution?.problem || 'Problem data unavailable';
    solutionText =
      storedSolutionText || caseProblemSolution?.solution || 'Solution data unavailable';
    evaluationParameterValues =
      resolvedFormData?.evaluation_parameters ||
      actualResult?.evaluation_parameters ||
      currentData?.evaluation_parameters ||
      null;
    businessContextValues =
      resolvedFormData?.businessContext ||
      actualResult?.business_context ||
      currentData?.business_context ||
      null;
  }

  const parameterEntries = useMemo(() => {
    if (!evaluationParameterValues || typeof evaluationParameterValues !== 'object') return [];
    return validKeys
      .filter((key) => evaluationParameterValues[key] != null)
      .map((key) => ({
        key,
        label: parameterLabels[key]?.label || titleize(key),
        value: Number(evaluationParameterValues[key]) || 0,
      }));
  }, [evaluationParameterValues]);

  const handleReevaluate = useCallback(() => {
    navigate('/', {
      state: {
        formData: {
          businessProblem: problemText,
          businessSolution: solutionText,
          parameters: evaluationParameterValues,
          businessContext: businessContextValues || {},
        },
      },
    });
  }, [navigate, problemText, solutionText, evaluationParameterValues, businessContextValues]);

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

    return validKeys
      .filter((key) => key in (actualResult.sub_scores || {}))
      .map((key) => {
        const value = actualResult.sub_scores[key];
        const numValue = value != null && !isNaN(value) ? Number(value) : 0;
        return {
          subject: formatFactorName(key),
          userValue: numValue,
          marketAvg,
        };
      });
  }, [actualResult]);

  const radarConfigs = [
    {
      name: 'Your Idea',
      dataKey: 'userValue',
      stroke: '#10b981',
      fill: '#10b981',
      fillOpacity: 0.35,
    },
    {
      name: 'Market Average',
      dataKey: 'marketAvg',
      stroke: '#3b82f6',
      fill: '#3b82f6',
      fillOpacity: 0.2,
    },
  ];

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

  const defaultAssessmentName = useMemo(() => {
    const source = isViewFromMyAssessments ? fetchedAssessment : currentData;
    if (!source) return '';

    // Prefer structured industry when available
    const _ = import.meta.env; // keep this module reference stable for bundlers
    // lazily import helper to avoid circular imports in some test setups
    let industryVal = null;
    try {
      const { getIndustry } = require('@/lib/metadata');
      industryVal = getIndustry(source);
    } catch (e) {
      industryVal = source.industry || source.metadata?.industry || null;
    }

    const base = source.caseName || source.projectTitle || industryVal || 'Assessment';

    const date = new Date().toISOString().split('T')[0];
    return `${base} - ${date}`;
  }, [isViewFromMyAssessments, fetchedAssessment, currentData]);

  const handleTogglePublic = useCallback(
    async (newValue) => {
      if (!isViewFromMyAssessments || !id) {
        toast.danger('Cannot update sharing settings', {
          description: 'This assessment must be saved first.',
          timeout: 4000,
        });
        return;
      }

      // Optimistic update - update UI immediately
      setOptimisticIsPublic(newValue);
      setIsUpdatingPublic(true);

      try {
        // Make API call without blocking UI
        await updateAssessment(id, { is_public: newValue });

        // Refetch to get updated data (including public_id if newly generated)
        // This uses placeholderData so it won't cause UI flicker
        await refetch();

        toast.success(newValue ? 'Assessment is now public' : 'Assessment is now private', {
          description: newValue
            ? 'Your assessment can now be viewed via the share link.'
            : 'Your assessment is no longer publicly accessible.',
          timeout: 3000,
        });
      } catch (error) {
        logger.error('Failed to update sharing settings:', error);
        toast.danger('Failed to update sharing settings', {
          description: error.message || 'Please try again.',
          timeout: 4000,
        });
        // Revert optimistic update on error
        setOptimisticIsPublic(null);
      } finally {
        setIsUpdatingPublic(false);
        // Clear optimistic state after brief delay to allow refetch to complete
        setTimeout(() => setOptimisticIsPublic(null), 300);
      }
    },
    [id, isViewFromMyAssessments, toast, refetch],
  );

  const handleConfirmRename = useCallback(
    async (newTitle) => {
      if (!id) throw new Error('No assessment selected');
      setIsRenaming(true);
      try {
        // Prevent duplicate names
        try {
          const existing = await getAssessments({ search: newTitle, pageSize: 100 });
          const dup = Array.isArray(existing?.assessments)
            ? existing.assessments.find(
                (a) =>
                  a.id !== id &&
                  a.title &&
                  a.title.trim().toLowerCase() === String(newTitle).trim().toLowerCase(),
              )
            : null;
          if (dup) throw new Error('You already have an assessment with that name');
        } catch (checkErr) {
          if (checkErr.message === 'You already have an assessment with that name') throw checkErr;
          logger.warn('Duplicate name check failed, continuing with rename:', checkErr?.message);
        }

        await updateAssessment(id, { title: newTitle });
        await refetch();
        toast.success('Assessment renamed successfully');
      } catch (err) {
        logger.error('Rename failed', err);
        throw err;
      } finally {
        setIsRenaming(false);
      }
    },
    [id, refetch],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!id) throw new Error('No assessment selected');
    setIsDeleting(true);
    try {
      await deleteAssessment(id);
      toast.success('Assessment deleted');
      navigate('/assessments');
    } catch (err) {
      logger.error('Delete failed', err);
      toast.danger('Failed to delete assessment');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [id, navigate]);

  const handleOpenRename = useCallback(() => {
    openRenameAssessmentDialog({
      defaultName: currentData?.title || '',
      onRename: handleConfirmRename,
      isLoading: isRenaming,
    });
  }, [openRenameAssessmentDialog, currentData?.title, handleConfirmRename, isRenaming]);

  const handleOpenDelete = useCallback(() => {
    openDeleteAssessmentDialog({
      assessmentName: currentData?.title || '',
      onConfirm: handleConfirmDelete,
      isLoading: isDeleting,
    });
  }, [openDeleteAssessmentDialog, currentData?.title, handleConfirmDelete, isDeleting]);

  if (detailLoading) {
    return <ResultsSkeleton />;
  }

  if (isViewFromMyAssessments && detailError) {
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

  if (isViewFromMyAssessments && !currentData) {
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

  const { strengths, gaps } = categorizeIntegrityGaps(actualResult.audit?.integrity_gaps);
  const casesSummaries = actualResult.audit?.similar_cases_summaries || [];

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
      toast.danger('No result data available to export', { timeout: 4000 });
      return;
    }

    await executeExport(() => exportAssessmentCSV(currentData), 'CSV');
  };

  const handleDownloadPDF = async () => {
    if (!actualResult) {
      toast.danger('No result data available to export', { timeout: 4000 });
      return;
    }

    await executeExport(
      () => exportAssessmentPDF(currentData, { elementId: 'results-content' }),
      'PDF',
    );
  };

  return (
    <>
      {/* Action Buttons & Share Section */}
      <div className="mb-6 mt-4 px-4 sm:px-6 space-y-4">
        {isViewFromMyAssessments && currentData?.title && (
          <div className="text-center mb-3 text-2xl font-bold text-slate-900 truncate">
            {currentData.title}
          </div>
        )}

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-linear-to-r from-slate-50 to-white rounded-2xl shadow-md border border-slate-200">
          {/* Show public share notice for public viewers */}
          {isPublicShare && (
            <Chip variant="soft" color="accent" size="lg" className="gap-1">
              <Globe size={12} />
              Public Shared Assessment
            </Chip>
          )}

          {!isPublicShare && (
            <>
              <Button variant="info-soft" onPress={handleViewHistory}>
                <FileText size={16} />
                My Assessments
              </Button>
              {currentData && (
                <Button variant="yellow-soft" onPress={handleReevaluate}>
                  <RefreshCw size={16} />
                  Re-evaluate
                </Button>
              )}
            </>
          )}
          {/* Export actions: visible to everyone but disabled for anonymous users. */}
          <>
            <Tooltip delay={0} placement="top" isDisabled={!!user}>
              <Tooltip.Trigger>
                <Button
                  variant="neutral-soft"
                  onPress={user ? handleDownloadPDF : undefined}
                  isDisabled={!user || isExporting}
                  disabled={!user || isExporting}
                  title={!user ? 'Sign in to get access to them' : undefined}
                >
                  <MonitorDown size={16} />
                  Download PDF
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content showArrow placement="top">
                <Tooltip.Arrow />
                <p className="text-xs font-bold">
                  {user
                    ? isExporting
                      ? 'Export in progress'
                      : 'Download result as PDF'
                    : 'Sign in to get access to them'}
                </p>
              </Tooltip.Content>
            </Tooltip>

            <Tooltip delay={0} placement="top" isDisabled={!!user}>
              <Tooltip.Trigger>
                <Button
                  variant="neutral-soft"
                  onPress={user ? handleDownloadCSV : undefined}
                  isDisabled={!user || isExporting}
                  disabled={!user || isExporting}
                  title={!user ? 'Sign in to get access to them' : undefined}
                >
                  <Download size={16} />
                  Cases CSV
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content showArrow placement="top">
                <Tooltip.Arrow />
                <p className="text-xs font-bold">
                  {user
                    ? isExporting
                      ? 'Export in progress'
                      : 'Export cases as CSV'
                    : 'Sign in to get access to them'}
                </p>
              </Tooltip.Content>
            </Tooltip>
          </>

          {!isViewFromMyAssessments && !isPublicShare && (
            <Button
              onPress={() => {
                if (!user) {
                  // Anonymous user: ensure the current result is persisted in the session
                  // (results and inputs are independent), then redirect to auth so the
                  // user can sign in and be returned to /results to confirm save.
                  try {
                    const formState = resolvedFormData || sessionSnapshot || getSession() || {};
                    const formInputs = formState?.inputs ? formState.inputs : formState;

                    const pendingResults =
                      (navigationResult && (navigationResult.result || navigationResult)) ||
                      sessionSnapshot?.results ||
                      getSession()?.results ||
                      null;

                    // Persist the snapshot to session storage (do NOT set isResultUnsaved flag)
                    try {
                      saveSession({
                        inputs: {
                          businessProblem: formInputs?.businessProblem || '',
                          businessSolution: formInputs?.businessSolution || '',
                          evaluationParameters: formInputs?.evaluation_parameters || {},
                          businessContext: formInputs?.businessContext || {},
                        },
                        results: pendingResults,
                      });
                    } catch (e) {
                      logger.warn('Failed to persist session for pending save:', e);
                    }

                    toast.info('Redirecting to sign in', {
                      description: 'You will be returned to your evaluation after signing in',
                      duration: 5000,
                    });

                    setTimeout(() => {
                      navigate('/auth', { state: { mode: 'signup', from: '/results' } });
                    }, 500);

                    return;
                  } catch (e) {
                    logger.error('Failed to prepare pending save', e);
                    toast.error('Failed to prepare save');
                    return;
                  }
                }

                openSaveAssessmentDialog({
                  defaultName: defaultAssessmentName,
                  onSave: handleSave,
                  scoringResult: actualResult,
                });
              }}
              variant="success"
              isDisabled={isExporting}
            >
              <Save size={16} />
              Save
            </Button>
          )}
          {/* If this assessment belongs to the current user, show rename/delete */}
          {isViewFromMyAssessments &&
            currentData &&
            currentData.user_id &&
            user?.id === currentData.user_id && (
              <>
                <Button variant="info-soft" onPress={handleOpenRename}>
                  <FolderPen size={16} />
                  Rename
                </Button>
                <Button variant="danger-soft" onPress={handleOpenDelete}>
                  <CircleX size={16} />
                  Delete
                </Button>
              </>
            )}
        </div>

        {/* Share Assessment Section */}
        {
          // isViewFromMyAssessments &&
          /*!isPublicShare && currentData*/
          !isPublicShare && (
            <Tooltip delay={0} isDisabled={!isResultsRoute}>
              <Tooltip.Trigger>
                <Card
                  className={`border border-slate-300 shadow-sm bg-white rounded-xl ${isResultsRoute ? 'opacity-95' : ''}`}
                >
                  {/* disable interactive controls when route is /results (unsaved session) */}
                  <div className={`${isResultsRoute ? 'pointer-events-none' : ''}`}>
                    <Switch
                      id="public-toggle"
                      variant="public"
                      size="md md:lg"
                      // size={?} //ResponsiveSizeWrapper used in components/common/Switch to auto-adjust size based on screen
                      isSelected={
                        optimisticIsPublic !== null
                          ? optimisticIsPublic
                          : currentData?.is_public || false
                      }
                      onChange={handleTogglePublic}
                      isDisabled={isUpdatingPublic || isResultsRoute}
                      className="flex items-center justify-between gap-4 px-2"
                    >
                      {({ isSelected }) => (
                        <>
                          <div className="">
                            <Label
                              htmlFor="public-toggle"
                              className="font-semibold text-slate-900 flex items-center gap-2 justify-start"
                            >
                              <span>Public Access</span>
                              <Link2 className="text-emerald-600" size={20} />
                            </Label>
                            <p className="text-sm text-slate-600">
                              Allow anyone with the link to view this assessment
                            </p>
                          </div>

                          <Switch.Control>
                            <Switch.Thumb>
                              <Switch.Icon />
                            </Switch.Thumb>
                          </Switch.Control>
                        </>
                      )}
                    </Switch>

                    {(optimisticIsPublic !== null ? optimisticIsPublic : currentData?.is_public) &&
                      currentData?.public_id && (
                        <div className="flex flex-row gap-2 mt-1">
                          <Input
                            id="share-url"
                            type="text"
                            readOnly
                            disabled={isResultsRoute || !currentData?.public_id}
                            value={
                              currentData?.public_id
                                ? `${window.location.origin}/assessments/share/${currentData.public_id}`
                                : ''
                            }
                            className="text-xs flex-1 bg-white"
                          />
                          <CopyButton
                            value={
                              currentData?.public_id
                                ? `${window.location.origin}/assessments/share/${currentData.public_id}`
                                : ''
                            }
                            disabled={isResultsRoute || !currentData?.public_id}
                          />
                        </div>
                      )}
                  </div>
                </Card>
              </Tooltip.Trigger>

              <Tooltip.Content showArrow placement="top">
                <Tooltip.Arrow />
                <p className="text-xs font-bold">Save assessment to share it publicly</p>
              </Tooltip.Content>
            </Tooltip>
          )
        }
      </div>

      {/* Case Summary */}
      <div data-export-section="case-summary">
        <Card className="border border-slate-300 shadow-sm bg-white rounded-xl mb-3">
          <div className="p-1 sm:p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Case Summary</h3>
                <p className="text-sm text-slate-600">
                  Problem, solution, parameters, and industry context
                </p>
              </div>
              {caseId && (
                <div className="text-xs font-semibold text-slate-600">Case ID: #{caseId}</div>
              )}
            </div>

            <div className="w-full">
              <Accordion className="w-full" allowsMultipleExpanded>
                {/* --- Problem Item --- */}
                <Accordion.Item id="problem" className="group/case">
                  <Accordion.Heading>
                    <Accordion.Trigger className="flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <Target
                          className="text-emerald-600 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-10 group-hover/case:drop-shadow-md mr-1.5"
                          size={20}
                        />
                        <div>
                          <h4 className="font-bold text-slate-900">Problem</h4>
                          <p className="text-sm text-slate-600">
                            What the assessment identifies as the problem
                          </p>
                        </div>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <div className="py-2">
                        <p className="text-sm text-slate-700 leading-relaxed">{problemText}</p>
                      </div>
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>

                {/* --- Solution Item --- */}
                <Accordion.Item id="solution" className="group/case">
                  <Accordion.Heading>
                    <Accordion.Trigger className="flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <Lightbulb
                          className="text-orange-500 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-10 group-hover/case:drop-shadow-md mr-1.5"
                          size={20}
                        />
                        <div>
                          <h4 className="font-bold text-slate-900">Solution</h4>
                          <p className="text-sm text-slate-600">Proposed solution summary</p>
                        </div>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <div className="py-2">
                        <p className="text-sm text-slate-700 leading-relaxed">{solutionText}</p>
                      </div>
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>

                {/* --- Business Context Item --- */}
                <Accordion.Item id="context" className="group/case">
                  <Accordion.Heading>
                    <Accordion.Trigger className="flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <Globe
                          className="text-blue-600 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-10 group-hover/case:drop-shadow-md mr-1.5"
                          size={20}
                        />
                        <div>
                          <h4 className="font-bold text-slate-900">Business Context</h4>
                          <p className="text-sm text-slate-600">
                            Operational and contextual details
                          </p>
                        </div>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <div className="py-2">
                        {businessContextValues &&
                        typeof businessContextValues === 'object' &&
                        Object.keys(businessContextValues).length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(businessContextValues).map(([key, value]) => {
                              const labelKey = key
                                .replace(/_/g, ' ')
                                .split(' ')
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ');
                              const displayValue =
                                value === null || value === undefined || value === ''
                                  ? 'Not specified'
                                  : value === true
                                    ? 'Yes'
                                    : value === false
                                      ? 'No'
                                      : String(value);
                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                >
                                  <span className="text-xs font-semibold text-slate-700">
                                    {labelKey}
                                  </span>
                                  <span className="text-xs font-bold text-blue-700">
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">
                            No business context data available.
                          </p>
                        )}
                      </div>
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>

                {/* --- Evaluation Parameters Item --- */}
                <Accordion.Item id="parameters" className="group/case">
                  <Accordion.Heading>
                    <Accordion.Trigger className="flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <BarChart3
                          className="text-slate-600 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-10 group-hover/case:drop-shadow-md mr-1.5"
                          size={20}
                        />
                        <div>
                          <h4 className="font-bold text-slate-900">Evaluation Parameters</h4>
                          <p className="text-sm text-slate-600">Input parameters and values</p>
                        </div>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <div className="py-2">
                        {' '}
                        {parameterEntries.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {parameterEntries.map((item) => (
                              <div
                                key={item.key}
                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                              >
                                <span className="text-xs font-semibold text-slate-700">
                                  {item.label}
                                </span>

                                <span className="text-xs font-bold text-emerald-700">
                                  {item.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">No parameter values available.</p>
                        )}
                      </div>
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Content */}
      {/* <ScrollShadow className="h-[calc(100vh-16rem)]"> */}
      <div id="results-content" className="max-w-7xl mx-auto px-0 sm:px-6 space-y-6">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          className="w-full"
          variant="primary"
        >
          {/* Mobile: Use Select */}
          <div className="md:hidden my-2 w-full flex items-center justify-center">
            <Select
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              variant="primary"
              className="w-2/5"
            >
              <Label className="text-xs font-semibold text-slate-600">View Section</Label>
              <Select.Trigger className="mt-2">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item textValue="summary" id="summary">
                    Summary
                  </ListBox.Item>
                  <ListBox.Item textValue="analysis" id="analysis">
                    Detailed Analysis
                  </ListBox.Item>
                  <ListBox.Item textValue="recommendations" id="recommendations">
                    Recommendations
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {/* Desktop: Use Tabs */}
          <Tabs.ListContainer className="my-4 hidden md:flex justify-center">
            <Tabs.List
              aria-label="Assessment Sections"
              className="bg-green-100/50 border-2 border-emerald-300/50"
            >
              <Tabs.Tab id="summary">
                Summary
                <Tabs.Indicator className="bg-green-50" />
              </Tabs.Tab>
              <Tabs.Tab id="analysis">
                Detailed Analysis
                <Tabs.Indicator className="bg-green-50" />
              </Tabs.Tab>
              <Tabs.Tab id="recommendations">
                Recommendations
                <Tabs.Indicator className="bg-green-50" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="summary" className="space-y-6">
            <ScoreOverviewSection
              actualResult={actualResult}
              overallScore={overallScore}
              casesSummaries={casesSummaries}
              strengths={strengths}
              gaps={gaps}
              isViewFromMyAssessments={isViewFromMyAssessments}
              currentData={currentData}
              optimisticIsPublic={optimisticIsPublic}
              topFactor={topFactor}
              focusFactor={focusFactor}
              avgFactorScore={avgFactorScore}
              resolvedBusinessViabilityScore={resolvedBusinessViabilityScore}
              reportTips={reportTips}
            />

            <CircularEconomyTierCard actualResult={actualResult} />
            <WeightedScoreCard actualResult={actualResult} />
            <ParameterConsistencyCard actualResult={actualResult} />
            <RStrategyAlignmentCard actualResult={actualResult} />
            <ScoreCategoryBreakdown actualResult={actualResult} />
            <GapAnalysisCard actualResult={actualResult} />

            {/* Industry & Metadata Section */}
            {actualResult.metadata && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <ClipboardList className="text-emerald-600" size={20} />
                    Project Classification
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Your project details and assessment context
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="p-4 bg-white rounded-lg border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                        Industry
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {titleize(actualResult.industry || '')}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 italic">{fieldHelp.industry}</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                        Scale
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {titleize(actualResult.metadata.scale)}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 italic">{fieldHelp.scale}</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                        Strategy
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {titleize(actualResult.metadata.r_strategy)}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 italic">
                        {fieldHelp.r_strategy}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                        Material
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {titleize(actualResult.metadata.primary_material)}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 italic">
                        {fieldHelp.primary_material}
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">
                        Geography
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {titleize(actualResult.metadata.geographic_focus)}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 italic">
                        {fieldHelp.geographic_focus}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Category Analysis */}
            <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
              <div className="p-1 sm:p-3">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Category Analysis</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Detailed breakdown across all evaluation criteria
                </p>
                <div className="space-y-3">
                  {validKeys.map((key) => {
                    const value = actualResult.sub_scores?.[key];
                    if (!(actualResult.sub_scores && key in actualResult.sub_scores)) return null;

                    const category = categoryMapping[key];
                    if (!category) return null;

                    const numValue = value != null && !isNaN(value) ? Number(value) : 0;
                    const barColor =
                      numValue >= 75
                        ? 'bg-emerald-500'
                        : numValue >= 50
                          ? 'bg-blue-500'
                          : 'bg-orange-500';
                    const badgeColor =
                      numValue >= 75
                        ? 'bg-emerald-500 text-white'
                        : numValue >= 50
                          ? 'bg-blue-500 text-white'
                          : 'bg-orange-500 text-white';

                    return (
                      <div key={key} className="p-4 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-900">{category.name}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">{category.desc}</p>
                          </div>
                          <div
                            className={`ml-4 px-3 py-1 rounded-full font-bold text-sm ${badgeColor}`}
                          >
                            {numValue}
                          </div>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.min(100, Math.max(0, numValue))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Business Viability Category */}
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900">Business Viability</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Economic feasibility and scalability
                        </p>
                      </div>
                      <div
                        className={`ml-4 px-3 py-1 rounded-full font-bold text-sm ${
                          resolvedBusinessViabilityScore >= 75
                            ? 'bg-emerald-500 text-white'
                            : resolvedBusinessViabilityScore >= 50
                              ? 'bg-blue-500 text-white'
                              : 'bg-orange-500 text-white'
                        }`}
                      >
                        {resolvedBusinessViabilityScore}
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          resolvedBusinessViabilityScore >= 75
                            ? 'bg-emerald-500'
                            : resolvedBusinessViabilityScore >= 50
                              ? 'bg-blue-500'
                              : 'bg-orange-500'
                        }`}
                        style={{ width: `${resolvedBusinessViabilityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Comparison */}
            {resolvedRadarData && resolvedRadarData.length > 0 ? (
              <Card className="shadow-sm bg-white rounded-xl">
                <div className="p-1 sm:p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        Performance Comparison
                      </h3>
                      <p className="text-sm text-slate-600">
                        How your idea compares to similar projects in the database
                      </p>
                    </div>
                    {/* <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        Your Idea
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-blue-500" />
                        Market Average
                      </span>
                    </div> */}
                  </div>

                  <div
                    className="w-full rounded-xl p-4"
                    style={{
                      '--color-userValue': '#10b981',
                      '--color-marketAvg': '#3b82f6',
                    }}
                  >
                    <RadarChart
                      data={resolvedRadarData}
                      radarConfigs={radarConfigs}
                      height={380}
                      showLegend={true}
                      showTooltip={true}
                      isLoading={detailLoading}
                    />
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Performance Comparison</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    How your idea compares to similar projects in the database
                  </p>
                  <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <p className="text-sm text-slate-600">
                      No comparison data available. Check that sub-scores are present in the
                      assessment result.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </Tabs.Panel>

          <Tabs.Panel id="analysis" className="space-y-6">
            {/* Integrity Analysis - Beautiful Accordion Design (same as Summary tab) */}
            {(gaps.length > 0 || strengths.length > 0) && (
              <Card className="border border-slate-300 shadow-sm rounded-xl bg-white">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Integrity Analysis</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    We compare your self-assessed scores against real-world projects in our database
                    to identify potential overestimations or underestimations.
                  </p>

                  <Accordion type="single" collapsible className="space-y-3">
                    {/* Strengths */}
                    {strengths.length > 0 && (
                      <Accordion.Item
                        value="strengths"
                        className="bg-green-50 border border-green-200 rounded-lg overflow-hidden"
                      >
                        <Accordion.Trigger className="px-4 py-3 hover:bg-green-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-green-600" size={20} />
                            <span className="text-base font-bold text-green-900">
                              Strengths Validated
                            </span>
                            <Chip
                              variant="primary"
                              color="success"
                              size="sm"
                              className="ml-2 font-bold"
                            >
                              {strengths.length}
                            </Chip>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Body className="px-4 pb-4">
                          <div className="space-y-2">
                            {strengths.map((strength, i) => (
                              <div
                                key={i}
                                className="flex gap-2 p-3 bg-white border border-green-200 rounded-lg"
                              >
                                <CheckCircle2
                                  className="text-green-600 shrink-0 mt-0.5"
                                  size={16}
                                />
                                <div className="flex-1">
                                  <p className="text-sm text-slate-700">
                                    {strength.issue || strength}
                                  </p>
                                  {strength.evidence_source_id && (
                                    <Chip variant="secondary" size="sm" className="mt-1 text-xs">
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

                    {/* Areas for Improvement */}
                    {gaps.length > 0 && (
                      <Accordion.Item
                        value="gaps"
                        className="bg-orange-50 border border-orange-200 rounded-lg overflow-hidden"
                      >
                        <Accordion.Trigger className="px-4 py-3 hover:bg-orange-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="text-orange-600" size={20} />
                            <span className="text-base font-bold text-orange-900">
                              Areas for Improvement
                            </span>
                            <Chip
                              variant="primary"
                              color="warning"
                              size="sm"
                              className="ml-2 font-bold"
                            >
                              {gaps.length}
                            </Chip>
                          </div>
                        </Accordion.Trigger>
                        <Accordion.Body className="px-4 pb-4">
                          <div className="space-y-2">
                            {gaps.map((gap, i) => {
                              const severity = gap.severity || 'medium';
                              const severityColors = {
                                high: 'bg-red-50 border-red-300',
                                medium: 'bg-orange-50 border-orange-300',
                                low: 'bg-yellow-50 border-yellow-300',
                              };

                              return (
                                <div
                                  key={i}
                                  className={`flex gap-2 p-3 rounded-lg border bg-white ${severityColors[severity]}`}
                                >
                                  <AlertCircle
                                    className="text-orange-600 shrink-0 mt-0.5"
                                    size={16}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700">
                                      {(gap.issue || gap).replace(/_/g, ' ')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Chip
                                        variant="primary"
                                        color={
                                          severity === 'high'
                                            ? 'danger'
                                            : severity === 'medium'
                                              ? 'warning'
                                              : 'default'
                                        }
                                        size="sm"
                                        className="font-bold text-xs"
                                      >
                                        {severity.charAt(0).toUpperCase() + severity.slice(1)}{' '}
                                        severity
                                      </Chip>
                                      {gap.evidence_source_id && (
                                        <Chip variant="secondary" size="sm" className="text-xs">
                                          Case #{gap.evidence_source_id}
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

            <AuditSummaryCard actualResult={actualResult} />

            <DatabaseEvidenceCard actualResult={actualResult} casesSummaries={casesSummaries} />
          </Tabs.Panel>

          <Tabs.Panel id="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Strengths & Gaps Card - Modern Design */}
              <Card className="border border-slate-300 shadow-sm rounded-xl bg-white">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Strengths & Gaps</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Highlights from your assessment and improvement areas
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-linear-to-br from-green-50 to-green-100 border border-green-300 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="text-green-600" size={16} />
                        <p className="text-sm font-bold text-green-900">Strengths</p>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {strengths.length > 0 ? (
                          strengths.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                              <span className="font-bold mt-0.5">•</span>
                              <span>
                                {strength.issue || strength}
                                {strength.evidence_source_id && (
                                  <Chip size="sm" variant="secondary" className="ml-2 text-xs">
                                    Case #{strength.evidence_source_id}
                                  </Chip>
                                )}
                              </span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="flex items-start gap-2 leading-relaxed">
                              <span className="font-bold mt-0.5">•</span>
                              <span>Strong focus on material reuse and recycling</span>
                            </li>
                            <li className="flex items-start gap-2 leading-relaxed">
                              <span className="font-bold mt-0.5">•</span>
                              <span>Clear value proposition for sustainability</span>
                            </li>
                            <li className="flex items-start gap-2 leading-relaxed">
                              <span className="font-bold mt-0.5">•</span>
                              <span>Potential for scalable implementation</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    {gaps.length > 0 && (
                      <div className="p-4 bg-linear-to-br from-orange-50 to-orange-100 border border-orange-300 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="text-orange-600" size={16} />
                          <p className="text-sm font-bold text-orange-900">Areas for Improvement</p>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {gaps.map((gap, i) => (
                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                              <span className="font-bold mt-0.5">•</span>
                              <span>
                                {gap.issue || gap}
                                {gap.evidence_source_id && (
                                  <Chip size="sm" variant="secondary" className="ml-2 text-xs">
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
                </div>
              </Card>

              {/* Recommendations Card - Modern Design */}
              <Card className="border border-slate-300 shadow-sm rounded-xl bg-white">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Recommendations</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Targeted steps to improve your circularity score
                  </p>

                  <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-xl">
                    <ul className="space-y-3 text-sm text-slate-700">
                      {actualResult.audit?.technical_recommendations?.length > 0 ? (
                        actualResult.audit.technical_recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <span className="font-bold mt-0.5 text-blue-600">•</span>
                            <span>{rec}</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-start gap-2 leading-relaxed">
                            <span className="font-bold mt-0.5 text-blue-600">•</span>
                            <span>Consider incorporating predictive maintenance strategies</span>
                          </li>
                          <li className="flex items-start gap-2 leading-relaxed">
                            <span className="font-bold mt-0.5 text-blue-600">•</span>
                            <span>Explore partnerships with recycling facilities</span>
                          </li>
                          <li className="flex items-start gap-2 leading-relaxed">
                            <span className="font-bold mt-0.5 text-blue-600">•</span>
                            <span>Develop metrics for tracking circularity performance</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
      {/* </ScrollShadow> */}
    </>
  );
}

ResultsPage.propTypes = {
  isViewFromMyAssessments: PropTypes.bool,
  isPublicShare: PropTypes.bool,
};
