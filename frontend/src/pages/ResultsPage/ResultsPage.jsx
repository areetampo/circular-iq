import { Checkbox, Label, Separator, toast } from '@heroui/react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  ExternalLink,
  MoveLeft,
  MoveRight,
  NotebookPen,
  RefreshCw,
  RotateCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { SectionHeading, Spinner } from '@/components/common';
import CopyButton from '@/components/common/CopyButton';
import DetailsDisplay from '@/components/common/DetailsDisplay';
import { parameterLabels, validKeys } from '@/constants/evaluationData';
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
import { useSession } from '@/features/session/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import {
  cleanUrl,
  formatRelativeTime,
  formatTimestamp,
  toTitleCase,
  truncate,
} from '@/lib/formatting';
import { formatFactorName } from '@/lib/scoring';
import { cn } from '@/utils/cn';
import { categorizeIntegrityGaps, extractProblemSolution } from '@/utils/content';
import { getSession, saveSession } from '@/utils/session';

import {
  AuditSummaryCard,
  CaseSummaryAccordions,
  CategoryAnalysis,
  CircularEconomyTierCard,
  DatabaseEvidenceCard,
  GapAnalysisCard,
  IndustryMetadataSection,
  IntegrityAnalysis,
  ParameterConsistencyCard,
  PerformanceComparison,
  RecommendationsCard,
  ResultsActionBar,
  ResultsSkeleton,
  RStrategyAlignmentCard,
  ScoreCategoryBreakdown,
  ScoreOverviewSection,
  StrengthsGapsCard,
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

  // Navigation handlers - only for complex navigation logic
  const handleBack = useCallback(() => {
    if (isViewFromMyAssessments) {
      navigate('/assessments');
    } else {
      navigate('/');
    }
  }, [isViewFromMyAssessments, navigate]);

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
            throw new Error('Name already exists');
          }
        } catch (errCheck) {
          // If the check itself failed due to network/auth, allow create to proceed
          if (errCheck.message === 'Name already exists') throw errCheck;
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
        label: parameterLabels[key]?.label || toTitleCase(key),
        value: Number(evaluationParameterValues[key]) || 0,
      }));
  }, [evaluationParameterValues]);

  const handleReevaluate = useCallback(() => {
    navigate('/', {
      state: {
        formData: {
          businessProblem: problemText,
          businessSolution: solutionText,
          evaluation_parameters: evaluationParameterValues,
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

    const date = formatTimestamp(new Date());
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
          if (dup) throw new Error('Name already exists');
        } catch (checkErr) {
          if (checkErr.message === 'Name already exists') throw checkErr;
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
      <DetailsDisplay
        variant="error"
        title="Failed to Load Assessment"
        message={detailError || 'Unable to retrieve the assessment details. Please try again.'}
        actions={[
          {
            label: 'Retry',
            icon: RotateCw,
            onPress: refetch,
            variant: 'teal',
          },
          {
            label: 'Go Back',
            icon: MoveLeft,
            variant: 'ghost',
            onClick: handleBack,
          },
        ].filter(Boolean)}
        showDefaultActions={false}
      />
    );
  }

  if (isViewFromMyAssessments && !currentData) {
    return (
      <DetailsDisplay
        variant="warning"
        title="Assessment Not Found"
        message="The requested assessment could not be found. It may have been deleted or you might not have access to it."
        actions={[
          {
            label: 'Retry Loading',
            icon: RotateCw,
            variant: 'teal',
            onClick: refetch,
          },
          {
            label: 'Return Home',
            icon: MoveLeft,
            as: Link,
            to: '/',
            variant: 'ghost',
          },
        ]}
        showDefaultActions={false}
      />
    );
  }

  // If no assessment data found in any source, show error
  if (!currentData) {
    return (
      <DetailsDisplay
        variant="info"
        title="No Assessment Data"
        message="No assessment results are available. Please complete an assessment to see results."
        actions={[
          {
            label: 'Start New Assessment',
            icon: MoveRight,
            variant: 'teal',
            as: Link,
            to: '/',
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

  logger.log('navigationResult', navigationResult);
  logger.log('currentData', currentData);
  logger.log('actualResult', actualResult);

  const publicUrl = `${window.location.origin}/assessments/share?id=${currentData.public_id}`;
  const displayPublicUrl = truncate(
    cleanUrl(publicUrl, { stripProtocol: true, stripWww: true }),
    30,
  );

  return (
    <div className="mx-auto max-w-5xl">
      {/* Action Buttons & Share Section */}
      <div className="my-8 space-y-4 px-4 sm:px-6">
        {isViewFromMyAssessments && currentData?.title && (
          <div className="mb-4">
            <h1 className="font-jua text-3xl font-medium tracking-[-0.02em] text-(--color-text-primary)">
              {currentData.title}
            </h1>
          </div>
        )}

        <ResultsActionBar
          currentData={currentData}
          user={user}
          isPublicShare={isPublicShare}
          isViewFromMyAssessments={isViewFromMyAssessments}
          onSave={handleSave}
          onOpenRename={handleOpenRename}
          onOpenDelete={handleOpenDelete}
          defaultAssessmentName={defaultAssessmentName}
          actualResult={actualResult}
          resolvedFormData={resolvedFormData}
          sessionSnapshot={sessionSnapshot}
          navigationResult={navigationResult}
          openSaveAssessmentDialog={openSaveAssessmentDialog}
        />

        {/* created_at for saved assessments (/assessments/:id) and processing_info?.timestamp for unsaved calculated results */}
        <div className="mb-1 w-full pr-2 text-right text-[0.68rem] text-(--color-text-secondary)/60">
          {currentData.created_at && <>saved {formatRelativeTime(currentData.created_at)}</>}
          {currentData.processing_info?.timestamp && (
            <>calculated {formatRelativeTime(currentData.processing_info.timestamp)}</>
          )}
        </div>

        {/* Share Assessment Section */}
        {!isPublicShare && currentData && (
          <div className="rounded-xl border-2 border-(--color-border-card) px-3 py-1">
            {/* Toggle row */}
            {isResultsRoute ? (
              <span className="text-[0.8125rem] font-medium opacity-80">
                Save assessment to enable sharing
              </span>
            ) : (
              <Checkbox
                id={`assessment-public-toggle-${currentData.id}`}
                isSelected={
                  optimisticIsPublic !== null ? optimisticIsPublic : currentData?.is_public || false
                }
                onChange={handleTogglePublic}
                isDisabled={isUpdatingPublic}
              >
                <Checkbox.Content className="-mr-1.5">
                  <Label htmlFor={`assessment-public-toggle-${currentData.id}`}>
                    <p className="text-[0.8125rem] font-medium opacity-80">
                      Public assessment{' '}
                      <span className="ml-0.5 text-[0.7rem] opacity-70">
                        (
                        {(
                          optimisticIsPublic !== null
                            ? optimisticIsPublic
                            : currentData?.is_public || false
                        )
                          ? 'on'
                          : 'off'}
                        )
                      </span>
                    </p>
                  </Label>
                </Checkbox.Content>
                {isUpdatingPublic ? (
                  <Spinner />
                ) : (
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                )}
              </Checkbox>
            )}

            {/* Share URL section */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                (optimisticIsPublic !== null ? optimisticIsPublic : currentData?.is_public) &&
                  currentData?.public_id
                  ? 'mt-2 max-h-20 opacity-100'
                  : 'max-h-0 opacity-0',
              )}
            >
              <div
                className={cn(
                  `flex origin-top-left scale-90 flex-col gap-3 opacity-70 sm:flex-row`,
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-2 [&>span]:font-mono',
                    isUpdatingPublic && '[&>span]:opacity-30',
                  )}
                >
                  <span>{displayPublicUrl}</span>
                  {isUpdatingPublic ? (
                    <div className="opacity-20">
                      <ExternalLink
                        size={18}
                        strokeWidth={2}
                        className="mx-1 mb-[4.5px] inline-flex cursor-not-allowed text-black/75"
                      />
                    </div>
                  ) : (
                    <Link to={publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink
                        size={18}
                        strokeWidth={2}
                        className="mx-1 mb-[4.5px] inline-flex text-black/75 transition-transform duration-150 hover:scale-110 hover:text-black active:scale-95"
                      />
                    </Link>
                  )}
                  <span>{'/'}</span>
                  <CopyButton
                    value={publicUrl}
                    description="URL"
                    noBorder
                    isDisabled={isUpdatingPublic}
                  />
                  <span>{'/'}</span>
                  <CopyButton
                    value={`${currentData.public_id}`}
                    description="ID"
                    noBorder
                    isDisabled={isUpdatingPublic}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full items-center justify-center">
        <Separator variant="secondary" className="mt-4 mb-6 w-1/2" />
      </div>

      {/* Case Summary */}
      <div data-export-section="case-summary" className="p-1 sm:p-3">
        <CaseSummaryAccordions
          businessProblem={problemText}
          businessSolution={solutionText}
          businessContext={businessContextValues}
          evaluationParameters={evaluationParameterValues}
        />
      </div>

      {/* Results Content */}
      <div id="results-content" className="mx-auto max-w-7xl px-0 sm:px-6">
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
        <Separator variant="secondary" className="my-8" />

        <CircularEconomyTierCard actualResult={actualResult} />
        <Separator variant="secondary" className="my-8" />

        <WeightedScoreCard actualResult={actualResult} />
        <Separator variant="secondary" className="my-8" />

        <ParameterConsistencyCard actualResult={actualResult} />
        <Separator variant="secondary" className="my-8" />

        <RStrategyAlignmentCard actualResult={actualResult} />
        <Separator variant="secondary" className="my-8" />

        <ScoreCategoryBreakdown actualResult={actualResult} />
        <Separator variant="secondary" className="my-8" />

        <GapAnalysisCard actualResult={actualResult} />
        <Separator variant="secondary" className="my-8" />

        <IndustryMetadataSection actualResult={actualResult} fieldHelp={fieldHelp} />
        <Separator variant="secondary" className="my-8" />

        <CategoryAnalysis
          actualResult={actualResult}
          resolvedBusinessViabilityScore={resolvedBusinessViabilityScore}
        />
        <Separator variant="secondary" className="my-8" />

        <PerformanceComparison
          resolvedRadarData={resolvedRadarData}
          radarConfigs={radarConfigs}
          detailLoading={detailLoading}
        />
        <Separator variant="secondary" className="my-8" />

        <IntegrityAnalysis strengths={strengths} gaps={gaps} />
        <Separator variant="secondary" className="my-8" />

        <AuditSummaryCard actualResult={actualResult} />
        <Separator variant="secondary" className="my-8" />

        <DatabaseEvidenceCard actualResult={actualResult} casesSummaries={casesSummaries} />
        <Separator variant="secondary" className="my-8" />

        <SectionHeading
          variant="small"
          icon={<NotebookPen className="size-4 text-(--color-accent)" />}
          className="mt-8"
        >
          Strategic Synthesis
        </SectionHeading>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StrengthsGapsCard strengths={strengths} gaps={gaps} />
          <RecommendationsCard actualResult={actualResult} />
        </div>
      </div>
    </div>
  );
}

ResultsPage.propTypes = {
  isViewFromMyAssessments: PropTypes.bool,
  isPublicShare: PropTypes.bool,
};
