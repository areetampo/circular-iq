import {
  Accordion,
  Alert,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  ProgressBar,
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
  ExternalLink,
  FileText,
  FolderPen,
  Frown,
  Globe,
  Lightbulb,
  Link2,
  Lock,
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
import BenchmarkTable from '@/components/results/BenchmarkTable';
import { categoryMapping, parameterLabels, validKeys } from '@/constants/evaluationData';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import {
  deleteAssessment,
  getAssessments,
  useAssessment,
  useCreateAssessment,
  usePublicAssessment,
} from '@/features/assessments';
import { updateAssessment } from '@/features/assessments/api/assessmentApi';
import { reconstructScoringResult } from '@/features/assessments/utils';
import { exportAssessmentCSV, exportAssessmentPDF } from '@/features/export';
import { useSession } from '@/features/session/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { useExportState } from '@/hooks/useExportState';
import { titleize } from '@/lib/formatting';
import { formatFactorName, getRiskBadgeColor, getScoreClass } from '@/lib/scoring';
import { categorizeIntegrityGaps, extractProblemSolution, getMatchStrength } from '@/utils/content';
import { getSession, saveSession } from '@/utils/session';

import ResultsSkeleton from './components/ResultsSkeleton';

export default function ResultsPage({ isViewFromMyAssessments = false, isPublicShare = false }) {
  const { id, publicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isResultsRoute = location.pathname.startsWith('/results');
  const navigationResult = location.state?.result;
  const navigationFormData = location.state?.formData;
  const isRestored = location.state?.isRestored || false;

  const { isExporting, executeExport } = useExportState();
  const { restoreEvaluation } = useSession();
  const { createAssessmentAsync } = useCreateAssessment();
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

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
  } = useAssessment(id, {
    enabled: isViewFromMyAssessments && !isPublicShare && !!id,
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
  // - Saved assessment view  -> `/assessments/:id/market-analysis` (protected)
  // - Unsaved/session result -> `/results/market-analysis` (public, uses session_evaluation_state.results)
  // NOTE: avoid referencing `currentData` here because it is declared later.
  const handleMarketAnalysis = useCallback(() => {
    // Treat as saved when viewing from My Assessments or when URL provides an id
    if (isViewFromMyAssessments || id) {
      if (id) navigate(`/assessments/${id}/market-analysis`);
      return;
    }

    // Otherwise use the session-based Market Analysis for unsaved results
    navigate('/results/market-analysis');
  }, [isViewFromMyAssessments, id, navigate]);

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
      console.error('Failed to save results to session:', e);
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
  console.log();
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
          console.warn('Duplicate name check failed, proceeding to create:', errCheck?.message);
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
          console.warn('Failed to update session after save:', e);
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
        console.warn('Save error:', error);
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
        console.error('Failed to update sharing settings:', error);
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
          console.warn('Duplicate name check failed, continuing with rename:', checkErr?.message);
        }

        await updateAssessment(id, { title: newTitle });
        await refetch();
        toast.success('Assessment renamed successfully');
      } catch (err) {
        console.error('Rename failed', err);
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
      console.error('Delete failed', err);
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
              <Button variant="teal-soft" onPress={handleMarketAnalysis}>
                <BarChart3 size={16} />
                Market Analysis
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
                      console.warn('Failed to persist session for pending save:', e);
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
                    console.error('Failed to prepare pending save', e);
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
              value={selectedTab}
              onChange={setSelectedTab}
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
            {/* Executive Summary */}
            <Card className="border border-slate-300 shadow-sm rounded-xl bg-white">
              <div className="p-1 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        Executive Summary
                      </h2>
                      {isViewFromMyAssessments && currentData && (
                        <Chip variant="secondary" size="sm" className="gap-1 ml-1">
                          {(optimisticIsPublic !== null
                            ? optimisticIsPublic
                            : currentData.is_public) === false ? (
                            <>
                              <Lock size={12} />
                              Private
                            </>
                          ) : (
                            <>
                              <Globe size={12} />
                              Contributing
                            </>
                          )}
                        </Chip>
                      )}
                    </div>
                    {actualResult.metadata?.short_description && (
                      <p className="text-sm text-slate-600 mb-2">
                        {actualResult.metadata.short_description}
                      </p>
                    )}
                    <p className="text-sm text-slate-600">
                      AI-powered circularity assessment and recommendations
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Chip
                      variant="soft"
                      color="warning"
                      size="sm"
                      className="font-semibold text-xs px-3 py-1"
                    >
                      Confidence: {actualResult.confidence_level || 0}%
                    </Chip>
                    {actualResult.processing_info?.processing_time_ms && (
                      <Chip variant="secondary" size="sm" className="text-xs">
                        Analysed in{' '}
                        {(actualResult.processing_info.processing_time_ms / 1000).toFixed(1)}s
                      </Chip>
                    )}
                  </div>
                </div>

                {actualResult.audit?.audit_verdict && (
                  <div className="mb-4 pl-4 border-l-4 border-emerald-500 bg-emerald-50 py-3 pr-3 rounded-r">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {actualResult.audit.audit_verdict}
                    </p>
                  </div>
                )}

                {actualResult.audit?.comparative_analysis && (
                  <div className="mb-4 pl-4 border-l-4 border-blue-500 bg-blue-50 py-3 pr-3 rounded-r">
                    <p className="text-xs font-semibold text-blue-900 uppercase mb-1">
                      Key Finding
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {actualResult.audit.comparative_analysis}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 bg-linear-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Overall Score</p>
                    <p className={`text-3xl font-bold ${getScoreClass(overallScore)}`}>
                      {overallScore}
                      <span className="text-lg text-slate-500">/100</span>
                    </p>
                  </div>

                  <div className="p-4 bg-linear-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Database Cases Analyzed</p>
                    <p className="text-3xl font-bold text-blue-700">{casesSummaries.length || 0}</p>
                  </div>

                  <div className="p-4 bg-linear-to-br from-green-50 to-white border-2 border-green-200 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Strengths Identified</p>
                    <p className="text-3xl font-bold text-green-700">{strengths.length || 0}</p>
                  </div>

                  <div className="p-4 bg-linear-to-br from-orange-50 to-white border-2 border-orange-200 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Improvement Areas</p>
                    <p className="text-3xl font-bold text-orange-700">{gaps.length || 0}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Score Highlights */}
            <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
              <div className="p-1 sm:p-3">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Score Highlights</h3>
                <p className="text-sm text-slate-600 mb-4">Key performance indicators</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-linear-to-br from-green-50 via-green-50 to-green-100 border-l-4 border-green-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-green-900 uppercase tracking-wide">
                        Strongest Factor
                      </p>
                      <TrendingUp className="text-green-600" size={16} />
                    </div>
                    <p className="text-xl font-bold text-green-900 mb-1">
                      {topFactor ? titleize(topFactor[0]) : 'N/A'}
                    </p>
                    <p className="text-sm font-semibold text-green-700">
                      {topFactor ? `${topFactor[1]}/100` : '—'}
                    </p>
                  </div>

                  <div className="p-5 bg-linear-to-br from-orange-50 via-orange-50 to-orange-100 border-l-4 border-orange-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                        Focus Area
                      </p>
                      <Target className="text-orange-600" size={16} />
                    </div>
                    <p className="text-xl font-bold text-orange-900 mb-1">
                      {focusFactor ? titleize(focusFactor[0]) : 'N/A'}
                    </p>
                    <p className="text-sm font-semibold text-orange-700">
                      {focusFactor ? `${focusFactor[1]}/100` : '—'}
                    </p>
                  </div>

                  <div className="p-5 bg-linear-to-br from-blue-50 via-blue-50 to-blue-100 border-l-4 border-blue-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                        Average Score
                      </p>
                      <BarChart3 className="text-blue-600" size={16} />
                    </div>
                    <p className="text-xl font-bold text-blue-900 mb-1">
                      {avgFactorScore}
                      <span className="text-sm text-slate-600">/100</span>
                    </p>
                    <p className="text-xs text-blue-700">
                      Business: {resolvedBusinessViabilityScore}/100
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Tips for New Users */}
            <Card className="border-2 border-dashed border-blue-400/80 bg-blue-50/60 shadow-sm rounded-xl">
              <div className="p-1 sm:p-3">
                <Card.Header className="px-0 pb-4 pt-0 flex items-center gap-3">
                  <div className="mt-0.5 rounded-lg bg-blue-100/70 p-2">
                    <Lightbulb className="text-blue-700" size={20} />
                  </div>
                  <div>
                    <Card.Title className="text-lg text-blue-900 text-center">
                      How to Use This Report
                    </Card.Title>
                    <Card.Description className="text-sm text-center text-slate-600 mt-1">
                      Your guide to understanding and acting on these insights
                    </Card.Description>
                  </div>
                </Card.Header>
                <Card.Content className="px-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {reportTips.map((tip) => (
                      <Card
                        key={tip.title}
                        className="border border-blue-200/80 bg-white/90 rounded-xl shadow-sm"
                        variant="secondary"
                      >
                        <Card.Header className="">
                          <Card.Title className="text-sm text-blue-900 flex items-center gap-2">
                            <tip.Icon className={tip.iconClassName} size={16} />
                            {tip.title}
                          </Card.Title>
                        </Card.Header>
                        <Card.Content className="-mt-1">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {tip.description}
                          </p>
                        </Card.Content>
                      </Card>
                    ))}
                  </div>
                </Card.Content>
              </div>
            </Card>

            {/* Derived Metrics */}
            {actualResult.derived_metrics && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <BarChart3 className="text-blue-600" size={20} /> Derived Metrics
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Additional consolidated metrics derived from your factor scores.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { key: 'technical_feasibility', label: 'Technical Feasibility' },
                      { key: 'economic_viability', label: 'Economic Viability' },
                      { key: 'circularity_potential', label: 'Circularity Potential' },
                    ].map(({ key, label }) => {
                      const value = actualResult.derived_metrics[key];
                      const numeric = typeof value === 'number' ? value : 0;
                      const color = numeric >= 70 ? 'success' : numeric >= 40 ? 'warning' : 'error';
                      return (
                        <div key={key} className="p-4 bg-white border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-bold text-slate-900">{label}</div>
                            <div className="text-sm font-bold text-slate-900">{numeric}</div>
                          </div>
                          <ProgressBar
                            value={Math.min(100, Math.max(0, numeric))}
                            color={
                              color === 'success'
                                ? 'success'
                                : color === 'warning'
                                  ? 'warning'
                                  : 'danger'
                            }
                            className="h-2 rounded"
                          />
                        </div>
                      );
                    })}
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-slate-900">Risk Level</div>
                        <Chip
                          variant="soft"
                          className={`text-xs font-bold ${getRiskBadgeColor(actualResult.derived_metrics.risk_level)}`}
                        >
                          {actualResult.derived_metrics.risk_level?.toUpperCase() || 'UNKNOWN'}
                        </Chip>
                      </div>
                      <div className="text-sm text-slate-600 mt-2">
                        Overall project risk assessment
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Circular Economy Tier */}
            {actualResult?.circular_economy_tier && (
              <Card
                className={`border-2 shadow-sm rounded-xl ${
                  actualResult.circular_economy_tier.badge_color === 'green'
                    ? 'border-green-300 bg-green-50'
                    : actualResult.circular_economy_tier.badge_color === 'blue'
                      ? 'border-blue-300 bg-blue-50'
                      : actualResult.circular_economy_tier.badge_color === 'amber'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-red-300 bg-red-50'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Circular Economy Tier
                      </span>
                      <h3
                        className={`text-2xl font-bold mt-0.5 ${
                          actualResult.circular_economy_tier.badge_color === 'green'
                            ? 'text-green-700'
                            : actualResult.circular_economy_tier.badge_color === 'blue'
                              ? 'text-blue-700'
                              : actualResult.circular_economy_tier.badge_color === 'amber'
                                ? 'text-amber-700'
                                : 'text-red-700'
                        }`}
                      >
                        {actualResult.circular_economy_tier.tier}
                      </h3>
                      <span className="text-xs text-slate-500">
                        Score range: {actualResult.circular_economy_tier.range}
                        {' · '}
                        {actualResult.circular_economy_tier.percentile_estimate}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">
                    {actualResult.circular_economy_tier.description}
                  </p>
                  <div className="p-3 bg-white/60 rounded-lg border border-current/10">
                    <span className="text-xs font-semibold text-slate-600">Next Milestone: </span>
                    <span className="text-xs text-slate-700">
                      {actualResult.circular_economy_tier.next_milestone}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Weighted Score Card */}
            {actualResult?.weighted_score_card && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Score Contribution Breakdown
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    How each factor contributed to your overall score of{' '}
                    <span className="font-bold text-slate-800">
                      {actualResult.overall_score}/100
                    </span>
                  </p>
                  <div className="space-y-2">
                    {Object.entries(actualResult.weighted_score_card.factors)
                      .sort(([, a], [, b]) => b.contribution - a.contribution)
                      .map(([key, factor]) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className="w-36 text-xs font-medium text-slate-600 truncate shrink-0">
                            {formatFactorName(key)}
                          </div>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 relative overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                factor.classification === 'Strong'
                                  ? 'bg-green-500'
                                  : factor.classification === 'Moderate'
                                    ? 'bg-blue-500'
                                    : factor.classification === 'Weak'
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                              }`}
                              style={{ width: `${factor.raw_score}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 w-8 text-right shrink-0">
                            {factor.raw_score}
                          </div>
                          <div className="text-xs text-slate-400 w-10 text-right shrink-0">
                            +{factor.contribution}
                          </div>
                          <Chip
                            variant="soft"
                            size="sm"
                            className={`text-xs shrink-0 ${
                              factor.classification === 'Strong'
                                ? 'text-green-700 bg-green-100'
                                : factor.classification === 'Moderate'
                                  ? 'text-blue-700 bg-blue-100'
                                  : factor.classification === 'Weak'
                                    ? 'text-amber-700 bg-amber-100'
                                    : 'text-red-700 bg-red-100'
                            }`}
                          >
                            {factor.classification}
                          </Chip>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                    <span>
                      Top contributor:{' '}
                      <span className="font-semibold text-slate-700">
                        {formatFactorName(actualResult.weighted_score_card.top_contributor)}
                      </span>
                    </span>
                    <span>
                      Needs most attention:{' '}
                      <span className="font-semibold text-slate-700">
                        {formatFactorName(actualResult.weighted_score_card.bottom_contributor)}
                      </span>
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Parameter Consistency */}
            {actualResult?.parameter_consistency && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Self-Assessment Reliability
                      </h3>
                      <p className="text-sm text-slate-500">
                        Internal consistency of your 8 parameter scores
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${
                          actualResult.parameter_consistency.score >= 85
                            ? 'text-green-600'
                            : actualResult.parameter_consistency.score >= 65
                              ? 'text-blue-600'
                              : actualResult.parameter_consistency.score >= 40
                                ? 'text-amber-600'
                                : 'text-red-600'
                        }`}
                      >
                        {actualResult.parameter_consistency.score}
                        <span className="text-sm text-slate-400">/100</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {actualResult.parameter_consistency.rating} Consistency
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {actualResult.parameter_consistency.interpretation}
                  </p>
                  {actualResult.parameter_consistency.issues.length > 0 && (
                    <div className="space-y-2">
                      {actualResult.parameter_consistency.issues.map((issue, i) => (
                        <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-800">{issue.issue}</p>
                          <div className="flex gap-1 mt-1">
                            {issue.factors.map((f) => (
                              <Chip
                                key={f}
                                size="sm"
                                variant="soft"
                                className="text-xs text-amber-700 bg-amber-100"
                              >
                                {formatFactorName(f)}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* R-Strategy Alignment */}
            {actualResult?.r_strategy_alignment?.alignment_score != null && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">R-Strategy Alignment</h3>
                      <p className="text-sm text-slate-500">
                        How well your scores support the detected{' '}
                        <span className="font-semibold">
                          {actualResult.r_strategy_alignment.strategy}
                        </span>{' '}
                        strategy
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${
                          actualResult.r_strategy_alignment.alignment_score >= 75
                            ? 'text-green-600'
                            : actualResult.r_strategy_alignment.alignment_score >= 55
                              ? 'text-blue-600'
                              : actualResult.r_strategy_alignment.alignment_score >= 35
                                ? 'text-amber-600'
                                : 'text-red-600'
                        }`}
                      >
                        {actualResult.r_strategy_alignment.alignment_score}
                        <span className="text-sm text-slate-400">/100</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {actualResult.r_strategy_alignment.rating}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">
                    {actualResult.r_strategy_alignment.message}
                  </p>
                  {actualResult.r_strategy_alignment.misaligned_factors.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-red-600">
                        Critical factors below threshold:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {actualResult.r_strategy_alignment.misaligned_factors.map((f) => (
                          <Chip
                            key={f}
                            size="sm"
                            variant="soft"
                            className="text-xs text-red-700 bg-red-100"
                          >
                            {formatFactorName(f)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  {actualResult.r_strategy_alignment.well_aligned_factors.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-green-600">Well aligned:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {actualResult.r_strategy_alignment.well_aligned_factors.map((f) => (
                          <Chip
                            key={f}
                            size="sm"
                            variant="soft"
                            className="text-xs text-green-700 bg-green-100"
                          >
                            {formatFactorName(f)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Score Breakdown Section */}
            {actualResult?.score_breakdown && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Score Breakdown</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Detailed breakdown by value category
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(actualResult.score_breakdown).map(([category, data]) => (
                      <div
                        key={category}
                        className="p-4 bg-white border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-bold text-slate-900">{category}</div>
                          <div className="text-sm font-bold text-slate-900">{data.score}</div>
                        </div>
                        <div className="text-xs text-slate-600 mb-2">{data.weight}</div>
                        <p className="text-xs text-slate-700 mb-3">{data.description}</p>
                        <div className="space-y-1">
                          {data.factors?.map((factor, i) => (
                            <Chip key={i} variant="secondary" size="sm" className="text-xs">
                              {factor.name}: {factor.score}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Gap Analysis & Benchmarks Section */}
            {actualResult.gap_analysis ? (
              actualResult.gap_analysis.has_benchmarks ? (
                <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                  <div className="p-1 sm:p-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <BarChart3 className="text-blue-600" size={20} /> Gap Analysis
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {actualResult.gap_analysis.message}
                    </p>

                    <BenchmarkTable
                      comparisons={actualResult.gap_analysis.comparisons}
                      opportunities={actualResult.gap_analysis.opportunities}
                      strengths={actualResult.gap_analysis.strengths}
                    />
                  </div>
                </Card>
              ) : (
                <Alert severity="info" className="mb-6">
                  {actualResult.gap_analysis.message || 'No benchmark data available.'}
                </Alert>
              )
            ) : null}

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

            {/* Audit Section */}
            {actualResult?.audit && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">AI Audit Summary</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Comprehensive analysis and recommendations
                  </p>

                  {actualResult.audit.integrity_gaps &&
                    actualResult.audit.integrity_gaps.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-2">Integrity Gaps</h4>
                        <ul className="space-y-2">
                          {actualResult.audit.integrity_gaps.map((gap, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Chip
                                variant="soft"
                                className={`text-xs ${gap.severity === 'high' ? 'text-red-700 bg-red-100' : gap.severity === 'medium' ? 'text-amber-700 bg-amber-100' : 'text-blue-700 bg-blue-100'}`}
                              >
                                {gap.severity || 'medium'}
                              </Chip>
                              <span className="text-sm text-slate-700">{gap.issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {actualResult.audit.strengths && actualResult.audit.strengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {actualResult.audit.strengths.map((strength, i) => (
                          <li key={i} className="text-sm text-slate-700">
                            • {strength.aspect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {actualResult.audit.technical_recommendations &&
                    actualResult.audit.technical_recommendations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-2">
                          Technical Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {actualResult.audit.technical_recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-slate-700">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {actualResult.audit.improvement_roadmap &&
                    actualResult.audit.improvement_roadmap.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-3">
                          Improvement Roadmap
                        </h4>
                        <div className="space-y-3">
                          {actualResult.audit.improvement_roadmap.map((item, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white border border-slate-200 rounded-lg flex gap-3"
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center
                                text-xs font-bold shrink-0 ${
                                  i === 0
                                    ? 'bg-red-100 text-red-700'
                                    : i === 1
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {item.priority}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.action}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  {item.target_factor && (
                                    <Chip
                                      size="sm"
                                      variant="soft"
                                      className="text-xs text-slate-600 bg-slate-100"
                                    >
                                      {formatFactorName(item.target_factor)}
                                    </Chip>
                                  )}
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    className={`text-xs ${
                                      item.impact === 'high'
                                        ? 'text-green-700 bg-green-100'
                                        : item.impact === 'medium'
                                          ? 'text-blue-700 bg-blue-100'
                                          : 'text-slate-600 bg-slate-100'
                                    }`}
                                  >
                                    {item.impact} impact
                                  </Chip>
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    className={`text-xs ${
                                      item.effort === 'low'
                                        ? 'text-green-700 bg-green-100'
                                        : item.effort === 'high'
                                          ? 'text-red-700 bg-red-100'
                                          : 'text-amber-700 bg-amber-100'
                                    }`}
                                  >
                                    {item.effort} effort
                                  </Chip>
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    className="text-xs text-slate-500 bg-slate-50"
                                  >
                                    {item.timeframe}
                                  </Chip>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {actualResult.audit.sdg_alignment &&
                    actualResult.audit.sdg_alignment.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-3">
                          UN Sustainable Development Goals
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {actualResult.audit.sdg_alignment.map((sdg, i) => (
                            <div
                              key={i}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2"
                            >
                              <div
                                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center
                                justify-center text-xs font-bold shrink-0"
                              >
                                {sdg.sdg_number}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-800">
                                  {sdg.sdg_name}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{sdg.rationale}</div>
                                <Chip
                                  size="sm"
                                  variant="soft"
                                  className={`text-xs mt-1 ${
                                    sdg.relevance === 'high'
                                      ? 'text-green-700 bg-green-100'
                                      : sdg.relevance === 'medium'
                                        ? 'text-blue-700 bg-blue-100'
                                        : 'text-slate-500 bg-slate-100'
                                  }`}
                                >
                                  {sdg.relevance} relevance
                                </Chip>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {actualResult.audit.market_opportunity_summary && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">
                        Market Opportunity
                      </h4>
                      <p className="text-sm text-blue-900">
                        {actualResult.audit.market_opportunity_summary}
                      </p>
                    </div>
                  )}

                  {actualResult.audit.similar_cases_summaries &&
                    actualResult.audit.similar_cases_summaries.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-2">
                          Similar Cases Summaries
                        </h4>
                        <ul className="space-y-1">
                          {actualResult.audit.similar_cases_summaries.map((summary, i) => (
                            <li key={i} className="text-sm text-slate-700">
                              • {summary}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {actualResult.audit.key_metrics_comparison && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">
                        Key Metrics Comparison
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(actualResult.audit.key_metrics_comparison).map(
                          ([key, value]) => (
                            <div key={key} className="p-3 bg-slate-50 rounded-lg">
                              <div className="text-xs font-bold text-slate-900 capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="text-sm text-slate-700">{value}</div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Database Evidence - Modern Card */}
            <Card
              data-export-section="database-evidence"
              className="border border-slate-300 shadow-sm rounded-xl bg-white"
            >
              <div className="p-1 sm:p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-emerald-600" size={20} />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Database Evidence</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Similar cases and benchmark comparisons from the dataset
                </p>

                <div>
                  {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
                    <div className="space-y-6">
                      {actualResult.similar_cases.map((caseItem, index) => {
                        const matchPercentage = Math.round((caseItem.similarity || 0) * 100);
                        const sourceCaseId = caseItem.id || `case-${index}`;
                        const caseTitle =
                          caseItem.title || casesSummaries[index] || `Related Case ${index + 1}`;
                        const problemText =
                          caseItem.problem ||
                          casesSummaries[index] ||
                          'No problem description available.';
                        const solutionText =
                          caseItem.solution || 'No solution description available.';
                        const { label: matchStrengthLabel, color: matchStrengthColor } =
                          getMatchStrength(caseItem.similarity || 0);

                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col gap-1 mb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {caseTitle}
                                  </h4>
                                  {/* Year + Location + Use type */}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {caseItem.year && (
                                      <Chip size="sm" variant="secondary" className="text-xs">
                                        {caseItem.year}
                                      </Chip>
                                    )}
                                    {caseItem.location && (
                                      <Chip size="sm" variant="secondary" className="text-xs">
                                        {caseItem.location}
                                      </Chip>
                                    )}
                                    {caseItem.use_type && (
                                      <Chip size="sm" variant="secondary" className="text-xs">
                                        {caseItem.use_type}
                                      </Chip>
                                    )}
                                    {caseItem.source_display && (
                                      <a
                                        href={caseItem.source_url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                      >
                                        <ExternalLink size={10} />
                                        {caseItem.source_display}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Chip size="sm" variant="flat" color="secondary">
                                    {matchPercentage}% similar
                                  </Chip>
                                </div>
                              </div>
                            </div>
                            <div className="mb-3">
                              <ProgressBar
                                value={matchPercentage}
                                color={
                                  matchPercentage >= 80
                                    ? 'success'
                                    : matchPercentage >= 60
                                      ? 'primary'
                                      : matchPercentage >= 40
                                        ? 'warning'
                                        : 'danger'
                                }
                                className="mb-1"
                              />
                              <span className={`text-sm font-medium ${matchStrengthColor}`}>
                                {matchStrengthLabel}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="p-3 border-l-4 border-emerald-600 rounded bg-gray-50">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  <Target className="text-emerald-600" size={16} />
                                  Problem Addressed
                                </h5>
                                <p className="text-sm text-gray-600">{problemText}</p>
                              </div>
                              <div className="p-3 border-l-4 border-emerald-600 rounded bg-gray-50">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  <Lightbulb className="text-emerald-600" size={16} />
                                  Solution Approach
                                </h5>
                                <p className="text-sm text-gray-600">{solutionText}</p>
                              </div>
                            </div>
                            {caseItem.case_scores && (
                              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs font-semibold text-purple-700 mb-2">
                                  Their scores (from database) — compare with yours
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {Object.entries(caseItem.case_scores).map(([factor, score]) => {
                                    const label = factor
                                      .split('_')
                                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                      .join(' ');
                                    const userScore = actualResult?.sub_scores?.[factor];
                                    const diff = userScore != null ? userScore - score : null;
                                    const scoreColor =
                                      score >= 75
                                        ? 'text-green-700'
                                        : score >= 50
                                          ? 'text-blue-700'
                                          : 'text-amber-700';
                                    return (
                                      <div key={factor} className="text-center">
                                        <div className="text-[10px] text-slate-500 truncate">
                                          {label}
                                        </div>
                                        <div className={`text-sm font-bold ${scoreColor}`}>
                                          {score}
                                        </div>
                                        {diff != null && (
                                          <div
                                            className={`text-[10px] font-semibold ${
                                              diff > 0
                                                ? 'text-green-600'
                                                : diff < 0
                                                  ? 'text-red-500'
                                                  : 'text-slate-400'
                                            }`}
                                          >
                                            {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                  Diff = your score − their score
                                </p>
                              </div>
                            )}
                            {/* Impact / outcomes row */}
                            {caseItem.impact && (
                              <div className="p-3 border-l-4 border-blue-500 rounded bg-blue-50 mb-3">
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">
                                  Impact & Outcomes
                                </h5>
                                <p className="text-sm text-gray-600">{caseItem.impact}</p>
                              </div>
                            )}

                            {/* Metadata chips row */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {caseItem.circular_strategy && (
                                <Chip size="sm" variant="flat" color="success">
                                  {caseItem.circular_strategy}
                                </Chip>
                              )}
                              {caseItem.materials && (
                                <Chip size="sm" variant="flat" color="default">
                                  {caseItem.materials}
                                </Chip>
                              )}
                              {caseItem.industry && (
                                <Chip size="sm" variant="flat" color="primary">
                                  {caseItem.industry}
                                </Chip>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() =>
                                  openResultsDatabaseEvidenceDetailsDrawer({
                                    caseItem,
                                    content: caseItem.summary || caseItem.problem || '',
                                    title: caseTitle,
                                    matchPercentage,
                                    matchStrengthLabel,
                                    matchColor: matchStrengthColor,
                                    sourceCaseId,
                                  })
                                }
                                className="text-emerald-600"
                              >
                                View Full Details <ArrowRight className="ml-1" size={14} />
                              </Button>
                            </div>
                            {index < actualResult.similar_cases.length - 1 && (
                              <hr className="mt-4 border-gray-300" />
                            )}
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
                </div>
              </div>
            </Card>
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
