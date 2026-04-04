import { Accordion, Checkbox, Input, toast } from '@heroui/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleX,
  Download,
  FolderPen,
  Globe,
  RefreshCw,
  Save,
  Target,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import RadarChart from '@/components/charts/RadarChart';
import { Button, Chip } from '@/components/common';
import CopyButton from '@/components/common/CopyButton';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { SectionHeading } from '@/components/common/SectionHeading';
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
import { cn } from '@/utils/cn';
import { categorizeIntegrityGaps, extractProblemSolution } from '@/utils/content';
import { getSession, saveSession } from '@/utils/session';

import {
  AuditSummaryCard,
  CaseSummaryAccordions,
  CircularEconomyTierCard,
  DatabaseEvidenceCard,
  FieldDisplayCard,
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
        iconClassName: 'var(--accent)',
      },
      {
        title: 'Strengths',
        description:
          'Areas where your initiative excels. Leverage these as competitive advantages and marketing points.',
        Icon: CheckCircle2,
        iconClassName: 'var(--success)',
      },
      {
        title: 'Focus Areas',
        description:
          'Priority improvements that could boost your score. Start with high-impact, low-effort changes first.',
        Icon: Target,
        iconClassName: 'var(--warning)',
      },
      {
        title: 'Benchmarking',
        description:
          'See how you compare to similar projects. Use this to set realistic improvement targets.',
        Icon: TrendingUp,
        iconClassName: 'var(--info)',
      },
      {
        title: 'Export Options',
        description:
          'Save this assessment and download a PDF report to share with stakeholders or track changes over time.',
        Icon: Download,
        iconClassName: 'var(--accent)',
      },
      {
        title: 'Next Steps',
        description:
          'Address the identified improvement areas and reassess after implementing changes to track progress.',
        Icon: RefreshCw,
        iconClassName: 'var(--success)',
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

        // Redirect to the saved assessment by public_id, not internal id
        const newPublicId = result?.assessment?.public_id || result?.public_id;
        if (newPublicId) {
          // Give a brief moment for cache invalidation, then navigate to the detail
          setTimeout(() => navigate(`/assessments/${newPublicId}`), 800);
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
      stroke: 'var(--success)',
      fill: 'var(--success)',
      fillOpacity: 0.35,
    },
    {
      name: 'Market Average',
      dataKey: 'marketAvg',
      stroke: 'var(--info)',
      fill: 'var(--info)',
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
      <div className="mb-8 mt-8 px-4 sm:px-6 space-y-4">
        {isViewFromMyAssessments && currentData?.title && (
          <div className="mb-4">
            <h1 className="font-mono text-2xl font-semibold text-(--color-text-primary) tracking-[-0.02em]">
              {currentData.title}
            </h1>
          </div>
        )}

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Left group - navigation */}
          <div className="flex items-center gap-3">
            {/* Show public share notice for public viewers */}
            {isPublicShare && (
              <Chip variant="info" color="default">
                <Globe size={14} className="mr-1" />
                Public Shared Assessment
              </Chip>
            )}

            {!isPublicShare && (
              <>
                <Button variant="ghost" size="sm" onPress={handleViewHistory}>
                  <ArrowLeft size={14} className="mr-1" /> My Assessments
                </Button>
                {currentData && (
                  <Button variant="ghost" size="sm" onPress={handleReevaluate}>
                    <RefreshCw size={14} className="mr-1" /> Re-evaluate
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Right group - actions, pushed to end */}
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onPress={user ? handleDownloadPDF : undefined}
              isDisabled={!user || isExporting}
            >
              <Download size={14} className="mr-1" /> PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={user ? handleDownloadCSV : undefined}
              isDisabled={!user || isExporting}
            >
              <Download size={14} className="mr-1" /> CSV
            </Button>
            {!isViewFromMyAssessments && !isPublicShare && (
              <Button
                variant="ghost"
                size="sm"
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
                disabled={isExporting}
              >
                <Save size={14} className="mr-1" /> Save
              </Button>
            )}
            {/* If this assessment belongs to the current user, show rename/delete */}
            {isViewFromMyAssessments &&
              currentData &&
              currentData.user_id &&
              user?.id === currentData.user_id && (
                <>
                  <Button variant="results-action" onPress={handleOpenRename}>
                    <FolderPen size={16} />
                    Rename
                  </Button>
                  <Button variant="results-action" onPress={handleOpenDelete}>
                    <CircleX size={16} />
                    Delete
                  </Button>
                </>
              )}
          </div>
        </div>

        {/* Share Assessment Section */}
        {!isPublicShare && currentData && (
          <div className="border-t-2 border-b-2 border-[rgba(180,160,130,0.18)] pt-3 pb-4 mb-0">
            {/* Toggle row */}
            <div className="flex items-center justify-start gap-3 ml-2">
              <div>
                <p className="text-[13px] font-semibold text-(--color-text-primary)">
                  Public sharing
                  <span className="text-[12px] font-normal ml-1.5 text-(--color-text-muted)">
                    {isResultsRoute
                      ? '(Save assessment to enable sharing)'
                      : '(Allow others to view this assessment via link)'}
                  </span>
                </p>
              </div>
              <Checkbox
                id="public-toggle"
                isSelected={
                  optimisticIsPublic !== null ? optimisticIsPublic : currentData?.is_public || false
                }
                onChange={handleTogglePublic}
                isDisabled={isUpdatingPublic || isResultsRoute}
                className={cn(
                  isResultsRoute ? 'hidden' : '',
                  "[&_[data-slot='checkbox-default-indicator--checkmark']]:size-4",
                )}
                name="xl-rounded"
                style={{
                  transform: 'scale(0.8)',
                }}
              >
                <Checkbox.Control
                  className={cn(
                    'size-6 rounded-full before:rounded-full',
                    isResultsRoute ? 'hidden' : '',
                  )}
                >
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox>
            </div>

            {/* Share URL — shown only when is_public = true and public_id exists */}
            {(optimisticIsPublic !== null ? optimisticIsPublic : currentData?.is_public) &&
              currentData?.public_id && (
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={`${window.location.origin}/assessments/share/${currentData.public_id}`}
                      className="text-xs w-full pr-10"
                      style={{
                        backgroundColor: 'var(--field-bg)',
                        borderColor: 'var(--field-border)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      <CopyButton
                        value={`${window.location.origin}/assessments/share/${currentData.public_id}`}
                        description="URL"
                        noBorder
                      />
                    </div>
                  </div>
                  <CopyButton value={`${currentData.public_id}`} description="ID" />
                </div>
              )}
          </div>
        )}
      </div>

      {/* Case Summary */}
      <div data-export-section="case-summary">
        <div className="p-1 sm:p-3">
          <SectionHeading variant="large">Case Summary</SectionHeading>
          <CaseSummaryAccordions
            businessProblem={problemText}
            businessSolution={solutionText}
            businessContext={businessContextValues}
            evaluationParameters={evaluationParameterValues}
          />
        </div>
      </div>

      {/* Results Content */}
      {/* <ScrollShadow className="h-[calc(100vh-16rem)]"> */}
      <div id="results-content" className="max-w-7xl mx-auto px-0 sm:px-6 space-y-6">
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
          <div
            className="border rounded-lg"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="p-1 sm:p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Industry', value: actualResult.industry || '', helpKey: 'industry' },
                  { label: 'Scale', value: actualResult.metadata.scale, helpKey: 'scale' },
                  {
                    label: 'Strategy',
                    value: actualResult.metadata.r_strategy,
                    helpKey: 'r_strategy',
                  },
                  {
                    label: 'Material',
                    value: actualResult.metadata.primary_material,
                    helpKey: 'primary_material',
                  },
                  {
                    label: 'Geography',
                    value: actualResult.metadata.geographic_focus,
                    helpKey: 'geographic_focus',
                  },
                ].map((field) => (
                  <FieldDisplayCard
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    helpText={fieldHelp[field.helpKey]}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Analysis */}
        <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
          <div className="p-1 sm:p-3">
            <SectionHeading variant="large">Category Analysis</SectionHeading>
            <p className="text-sm text-(--color-text-muted) mb-4 -mt-4">
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
                    ? '#4a7c59' // muted green
                    : numValue >= 50
                      ? '#b07d3a' // muted amber
                      : '#8b3a3a'; // muted red
                const badgeColor =
                  numValue >= 75
                    ? '#4a7c59' // muted green
                    : numValue >= 50
                      ? '#b07d3a' // muted amber
                      : '#8b3a3a'; // muted red

                return (
                  <div
                    key={key}
                    className="p-4 rounded-2xl border-2 border-[rgba(180,160,130,0.18)] bg-[rgba(245,240,232,0.5)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-(--color-text-primary)">
                          {category.name}
                        </h4>
                        <p className="text-xs mt-0.5 text-(--color-text-muted)">{category.desc}</p>
                      </div>
                      <div
                        className="ml-4 px-3 py-1 rounded-lg font-bold text-sm bg-transparent border border-[rgba(180,160,130,0.18)]"
                        style={{ color: badgeColor }}
                      >
                        {numValue}
                      </div>
                    </div>

                    <div className="w-full rounded-full h-2 overflow-hidden bg-[rgba(180,160,130,0.2)]">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, numValue))}%`,
                          backgroundColor: barColor,
                          opacity: numValue >= 75 ? 0.7 : numValue >= 50 ? 0.6 : 0.6,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Business Viability Category */}
              <div className="p-4 rounded-2xl border border-[rgba(180,160,130,0.18)] bg-[rgba(245,240,232,0.5)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-(--color-text-primary)">
                      Business Viability
                    </h4>
                    <p className="text-xs mt-0.5 text-(--color-text-muted)">
                      Economic feasibility and scalability
                    </p>
                  </div>
                  <div
                    className="ml-4 px-3 py-1 rounded-lg font-bold text-sm bg-transparent border border-[rgba(180,160,130,0.18)]"
                    style={{
                      color:
                        resolvedBusinessViabilityScore >= 75
                          ? '#4a7c59' // muted green
                          : resolvedBusinessViabilityScore >= 50
                            ? '#b07d3a' // muted amber
                            : '#8b3a3a', // muted red
                    }}
                  >
                    {resolvedBusinessViabilityScore}
                  </div>
                </div>

                <div className="w-full rounded-full h-2 overflow-hidden bg-[rgba(180,160,130,0.2)]">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${resolvedBusinessViabilityScore}%`,
                      backgroundColor:
                        resolvedBusinessViabilityScore >= 75
                          ? '#4a7c59' // muted green
                          : resolvedBusinessViabilityScore >= 50
                            ? '#b07d3a' // muted amber
                            : '#8b3a3a', // muted red
                      opacity: resolvedBusinessViabilityScore >= 75 ? 0.7 : 0.6,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Performance Comparison */}
        {resolvedRadarData && resolvedRadarData.length > 0 ? (
          <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
            <div className="p-1 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <SectionHeading variant="large">Performance Comparison</SectionHeading>
                  <p className="text-sm text-(--color-text-muted) -mt-4">
                    How your idea compares to similar projects in the database
                  </p>
                </div>
              </div>

              <div
                className="w-full rounded-3xl p-4 bg-[rgba(245,240,232,0.5)] border-0 border-[rgba(180,160,130,0.18)]"
                style={{
                  '--color-userValue': 'var(--success)',
                  '--color-marketAvg': 'var(--accent)',
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
          </div>
        ) : (
          <div className="border border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
            <div className="p-5 sm:p-6">
              <SectionHeading variant="large">Performance Comparison</SectionHeading>
              <p className="text-sm text-(--color-text-muted)">
                No comparison data available. Check that sub-scores are present in the assessment
                result.
              </p>
            </div>
          </div>
        )}
        {/* Integrity Analysis - Beautiful Accordion Design (same as Summary tab) */}
        {(gaps.length > 0 || strengths.length > 0) && (
          <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
            <div className="p-2 sm:p-4">
              <SectionHeading variant="small" className="mb-1">
                Integrity Analysis
              </SectionHeading>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                We compare your self-assessed scores against real-world projects in our database to
                identify potential overestimations or underestimations.
              </p>

              <Accordion type="single" collapsible className="space-y-3">
                {/* Strengths */}
                {strengths.length > 0 && (
                  <Accordion.Item
                    value="strengths"
                    className="rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: 'var(--success-soft)',
                      borderColor: 'var(--success)',
                    }}
                  >
                    <Accordion.Trigger className="px-4 py-3 hover:bg-success-soft transition-colors">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                        <span
                          className="text-base font-semibold"
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          Strengths Validated
                        </span>
                        <Chip variant="success" size="sm" className="ml-2 font-bold">
                          {strengths.length}
                        </Chip>
                      </div>
                    </Accordion.Trigger>
                    <Accordion.Body className="px-4 pb-4">
                      <div className="space-y-2">
                        {strengths.map((strength, i) => (
                          <div
                            key={i}
                            className="flex gap-2 p-3 rounded-lg border"
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--success)',
                            }}
                          >
                            <CheckCircle2
                              className="shrink-0 mt-0.5"
                              size={16}
                              style={{ color: 'var(--success)' }}
                            />
                            <div className="flex-1">
                              <p
                                className="text-sm"
                                style={{
                                  color: 'var(--foreground)',
                                }}
                              >
                                {strength.issue || strength}
                              </p>
                              {strength.evidence_source_id && (
                                <Chip variant="default" className="mt-1 text-xs">
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
                    className="rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: 'var(--warning-soft)',
                      borderColor: 'var(--warning)',
                    }}
                  >
                    <Accordion.Trigger className="px-4 py-3 hover:bg-warning-soft transition-colors">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                        <span
                          className="text-base font-semibold"
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          Areas for Improvement
                        </span>
                        <Chip variant="warning" size="sm" className="ml-2 font-bold">
                          {gaps.length}
                        </Chip>
                      </div>
                    </Accordion.Trigger>
                    <Accordion.Body className="px-4 pb-4">
                      <div className="space-y-2">
                        {gaps.map((gap, i) => {
                          const severity = gap.severity || 'medium';
                          const severityColors = {
                            high: 'var(--danger-soft)',
                            medium: 'var(--warning-soft)',
                            low: 'var(--info-soft)',
                          };

                          return (
                            <div
                              key={i}
                              className={`flex gap-2 p-3 rounded-lg border bg-surface`}
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: severityColors[severity],
                              }}
                            >
                              <AlertCircle
                                className="shrink-0 mt-0.5"
                                size={16}
                                style={{ color: 'var(--warning)' }}
                              />
                              <div className="flex-1">
                                <p
                                  className="text-sm"
                                  style={{
                                    color: 'var(--foreground)',
                                  }}
                                >
                                  {(gap.issue || gap).replace(/_/g, ' ')}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Chip
                                    variant={
                                      severity === 'high'
                                        ? 'danger'
                                        : severity === 'medium'
                                          ? 'warning'
                                          : 'default'
                                    }
                                    size="sm"
                                    className="font-bold text-xs"
                                  >
                                    {severity.charAt(0).toUpperCase() + severity.slice(1)} severity
                                  </Chip>
                                  {gap.evidence_source_id && (
                                    <Chip variant="default" className="text-xs">
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
          </div>
        )}

        <AuditSummaryCard actualResult={actualResult} />

        <DatabaseEvidenceCard actualResult={actualResult} casesSummaries={casesSummaries} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Strengths & Gaps Card - Modern Design */}
          <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
            <div className="p-2 sm:p-4">
              <SectionHeading variant="small" className="mb-6">
                Strengths & Gaps
              </SectionHeading>
              <p className="text-sm mb-4 -mt-4" style={{ color: 'var(--muted)' }}>
                Highlights from your assessment and improvement areas
              </p>
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl border-2"
                  style={{
                    background: 'var(--background-secondary)',
                    borderColor: 'rgba(107,142,109,0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={20} style={{ color: '#6B8E6D' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Strengths
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {strengths.length > 0 ? (
                      strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span
                            className="font-semibold mt-0.5"
                            style={{ color: 'var(--foreground)' }}
                          >
                            •
                          </span>
                          <span
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            {strength.issue || strength}
                            {strength.evidence_source_id && (
                              <Chip variant="default" className="ml-2 text-xs">
                                Case #{strength.evidence_source_id}
                              </Chip>
                            )}
                          </span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2 leading-relaxed">
                          <span
                            className="font-semibold mt-0.5"
                            style={{ color: 'var(--foreground)' }}
                          >
                            •
                          </span>
                          <span
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            Strong focus on material reuse and recycling
                          </span>
                        </li>
                        <li className="flex items-start gap-2 leading-relaxed">
                          <span
                            className="font-semibold mt-0.5"
                            style={{ color: 'var(--foreground)' }}
                          >
                            •
                          </span>
                          <span
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            Clear value proposition for sustainability
                          </span>
                        </li>
                        <li className="flex items-start gap-2 leading-relaxed">
                          <span
                            className="font-semibold mt-0.5"
                            style={{ color: 'var(--foreground)' }}
                          >
                            •
                          </span>
                          <span
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            Potential for scalable implementation
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {gaps.length > 0 && (
                  <div
                    className="p-4 rounded-xl border-2"
                    style={{
                      background: 'var(--background-secondary)',
                      borderColor: 'rgba(195,75,75,0.3)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={20} style={{ color: '#C3916B' }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        Areas for Improvement
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {gaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span
                            className="font-semibold mt-0.5"
                            style={{ color: 'var(--foreground)' }}
                          >
                            •
                          </span>
                          <span
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            {gap.issue || gap}
                            {gap.evidence_source_id && (
                              <Chip variant="default" className="ml-2 text-xs">
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
          </div>

          {/* Recommendations Card - Modern Design */}
          <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
            <div className="p-2 sm:p-4">
              <SectionHeading variant="small" className="mb-6">
                Recommendations
              </SectionHeading>
              <p className="text-sm mb-4 -mt-4" style={{ color: 'var(--muted)' }}>
                Targeted steps to improve your circularity score
              </p>

              <div
                className="p-4 rounded-xl border-0"
                style={{
                  background:
                    'linear-gradient(to bottom right, var(--accent-soft), var(--accent-soft))',
                  borderColor: 'var(--accent)',
                }}
              >
                <ul className="space-y-3 text-sm">
                  {actualResult.audit?.technical_recommendations?.length > 0 ? (
                    actualResult.audit.technical_recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                          •
                        </span>
                        <span
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          {rec}
                        </span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2 leading-relaxed">
                        <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                          •
                        </span>
                        <span
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          Consider incorporating predictive maintenance strategies
                        </span>
                      </li>
                      <li className="flex items-start gap-2 leading-relaxed">
                        <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                          •
                        </span>
                        <span
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          Explore partnerships with recycling facilities
                        </span>
                      </li>
                      <li className="flex items-start gap-2 leading-relaxed">
                        <span className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                          •
                        </span>
                        <span
                          style={{
                            color: 'var(--foreground)',
                          }}
                        >
                          Develop metrics for tracking circularity performance
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* </ScrollShadow> */}
    </>
  );
}

ResultsPage.propTypes = {
  isViewFromMyAssessments: PropTypes.bool,
  isPublicShare: PropTypes.bool,
};
