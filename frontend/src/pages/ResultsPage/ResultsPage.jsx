import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@heroui/react';
import RadarChart from '@/components/charts/RadarChart';
import { exportAssessmentCSV, exportAssessmentPDF } from '@/features/export';
import { validKeys, categoryMapping, parameterLabels } from '@/constants/evaluationData';
import { categorizeIntegrityGaps, extractCaseInfo, extractProblemSolution } from '@/utils/content';
import { useToast } from '@/hooks/useToast';
import { useExportState } from '@/hooks/useExportState';
import { useSession } from '@/features/session/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { saveSession, getSession } from '@/utils/session';

import { titleize } from '@/lib/formatting';
import {
  useAssessment,
  usePublicAssessment,
  useCreateAssessment,
  getAssessments,
  deleteAssessment,
} from '@/features/assessments';
import { updateAssessment } from '@/features/assessments/api/assessmentApi';
import {
  Card,
  Tabs,
  Switch,
  Input,
  Label,
  Accordion,
  Select,
  ListBox,
  Chip,
  Tooltip,
} from '@heroui/react';
import { Button } from '@/components/common';
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
  Copy,
} from 'lucide-react';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import ResultsSkeleton from './components/ResultsSkeleton';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useGlobalDialog } from '@/contexts/DialogContext';

export default function ResultsPage({ isViewFromMyAssessments = false, isPublicShare = false }) {
  const { id, publicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isResultsRoute = location.pathname.startsWith('/results');
  const navigationResult = location.state?.result;
  const navigationFormData = location.state?.formData;
  const isRestored = location.state?.isRestored || false;

  const { addToast } = useToast();
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
      addToast('Previous session restored.', 'info');
      setSessionRestored(true);
      sessionStorage.setItem('sessionRestoredOnce', 'true');
    }
  }, [isViewFromMyAssessments, navigationResult, restoreEvaluation, sessionRestored, addToast]);

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
        parameters:
          resolvedFormData?.parameters ??
          resultData.parameters ??
          resultData.input_parameters ??
          {},
      };

      const stateToSave = {
        // Only update `inputs` when we actually have form data from navigation.
        // This preserves `session_evaluation_state.inputs` for other flows.
        ...(resolvedFormData ? { inputs: { ...snapshotInputs } } : {}),
        results: {
          // Embed the snapshot inputs inside results so the snapshot is self-contained
          businessProblem: snapshotInputs.businessProblem,
          businessSolution: snapshotInputs.businessSolution,
          parameters: snapshotInputs.parameters,
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

    // coerce metadata fields that should be strings
    if (out.metadata && typeof out.metadata === 'object') {
      out.metadata = { ...out.metadata };
      if (out.metadata.industry == null) out.metadata.industry = out.metadata.industry || undefined;
      if (out.metadata.region == null) out.metadata.region = out.metadata.region || undefined;
    }

    return out;
  }

  // Save assessment handler
  console.log();
  const handleSave = useCallback(
    async (name, isPublic = true, contributeToGlobalBenchmarks = true) => {
      try {
        const baseResult = currentData?.result_json || currentData || {};
        const inputParameters =
          resolvedFormData?.parameters || baseResult?.input_parameters || null;
        let resultPayload = inputParameters
          ? { ...baseResult, input_parameters: inputParameters }
          : baseResult;

        // Defensive normalization to avoid backend validation failures
        resultPayload = normalizeResultForSave(resultPayload);

        const saveData = {
          name,
          result_json: resultPayload,
          industry: currentData?.metadata?.industry || 'Unknown',
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
            // result payload (server returns `parameters` / `input_parameters`),
            // then fall back to top-level `currentData` parameters.
            resolvedFormData?.parameters ||
            resultPayload?.parameters ||
            resultPayload?.input_parameters ||
            currentData?.parameters ||
            currentData?.result_json?.parameters ||
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
        addToast('Assessment saved successfully! Redirecting...', 'success');

        // After successful save, clear only the results from local evaluation state but keep inputs
        try {
          const currentState = getSession();

          saveSession({
            inputs: currentState?.inputs || {
              businessProblem: resolvedFormData?.businessProblem || '',
              businessSolution: resolvedFormData?.businessSolution || '',
              parameters: resolvedFormData?.parameters || {},
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
    [currentData, resolvedFormData, createAssessmentAsync, addToast, navigate],
  );

  const actualResult = currentData?.result_json || currentData || null;
  const caseId = actualResult?.case_id || currentData?.id || id;
  const caseIndustry = actualResult?.metadata?.industry || '';
  const caseProblemSolution = useMemo(
    () => extractProblemSolution(actualResult || currentData || {}),
    [actualResult, currentData],
  );

  // When results are restored via session restore, always use the snapshot in results for Case Summary
  let problemText, solutionText, industryText, parameterValues;

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
    industryText =
      (res.metadata?.industry && titleize(res.metadata.industry)) ||
      (res.industry && titleize(res.industry)) ||
      (res.audit?.industry && titleize(res.audit.industry)) ||
      'Industry data unavailable';
    parameterValues =
      res.input_parameters ||
      res.parameters ||
      (res.audit?.parameters ? res.audit.parameters : null);
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
    industryText = caseIndustry ? titleize(caseIndustry) : 'Industry data unavailable';
    parameterValues =
      resolvedFormData?.parameters ||
      actualResult?.input_parameters ||
      currentData?.result_json?.input_parameters ||
      null;
  }

  const parameterEntries = useMemo(() => {
    if (!parameterValues || typeof parameterValues !== 'object') return [];
    return validKeys
      .filter((key) => parameterValues[key] != null)
      .map((key) => ({
        key,
        label: parameterLabels[key]?.label || titleize(key),
        value: Number(parameterValues[key]) || 0,
      }));
  }, [parameterValues]);

  const handleReevaluate = useCallback(() => {
    navigate('/', {
      state: {
        formData: {
          businessProblem: problemText,
          businessSolution: solutionText,
          parameters: parameterValues,
        },
      },
    });
  }, [navigate, problemText, solutionText, parameterValues]);

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
          subject: categoryMapping[key]?.name || key.replace(/_/g, ' '),
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

    const base =
      source.caseName || source.projectTitle || source.metadata?.industry || 'Assessment';

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

  const handleCopyShareLink = async () => {
    if (!currentData?.public_id) {
      toast.danger('Share link unavailable', {
        description: 'This assessment does not have a public ID.',
        timeout: 4000,
      });
      return;
    }

    const shareUrl = `${window.location.origin}/assessments/share/${currentData.public_id}`;

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
              <Globe className="w-3 h-3" />
              Public Shared Assessment
            </Chip>
          )}

          {!isPublicShare && (
            <>
              <Button variant="info-soft" onPress={handleViewHistory}>
                <FileText className="w-4 h-4" />
                My Assessments
              </Button>
              <Button variant="teal-soft" onPress={handleMarketAnalysis}>
                <BarChart3 className="w-4 h-4" />
                Market Analysis
              </Button>
              {currentData && (
                <Button variant="yellow-soft" onPress={handleReevaluate}>
                  <RefreshCw className="w-4 h-4" />
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
                  <FileText className="w-4 h-4" />
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
                  <Download className="w-4 h-4" />
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
                    const formInputs = resolvedFormData || sessionSnapshot || getSession() || {};

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
                          parameters: formInputs?.parameters || {},
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
                });
              }}
              variant="success"
              isDisabled={isExporting}
            >
              <Save className="w-4 h-4" />
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
                  <NotebookText className="w-4 h-4" />
                  Rename
                </Button>
                <Button variant="danger-soft" onPress={handleOpenDelete}>
                  <AlertCircle className="w-4 h-4" />
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
                      isSelected={
                        optimisticIsPublic !== null
                          ? optimisticIsPublic
                          : currentData?.is_public || false
                      }
                      onChange={handleTogglePublic}
                      isDisabled={isUpdatingPublic || isResultsRoute}
                      className="flex items-center justify-between gap-4 px-2"
                    >
                      <div className="">
                        <Label
                          htmlFor="public-toggle"
                          className="font-semibold text-slate-900 flex items-center gap-2 justify-start"
                        >
                          <span>Public Access</span>
                          <Link2 className="w-6 h-6 text-emerald-600" />
                        </Label>
                        <p className="text-sm text-slate-600">
                          Allow anyone with the link to view this assessment
                        </p>
                      </div>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>

                    {(optimisticIsPublic !== null ? optimisticIsPublic : currentData?.is_public) &&
                      currentData?.public_id && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
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
                            className="flex-1 font-mono text-sm bg-white"
                          />
                          <Button
                            variant="info-soft"
                            onPress={handleCopyShareLink}
                            isDisabled={isResultsRoute || !currentData?.public_id}
                            disabled={isResultsRoute || !currentData?.public_id}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
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
                <Accordion.Item id="problem">
                  <Accordion.Heading>
                    <Accordion.Trigger className="group/case flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-emerald-600 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-[10deg] group-hover/case:drop-shadow-md mr-1.5" />
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

                <Accordion.Item id="solution">
                  <Accordion.Heading>
                    <Accordion.Trigger className="group/case flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="h-5 w-5 text-orange-500 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-[10deg] group-hover/case:drop-shadow-md mr-1.5" />
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

                <Accordion.Item id="parameters">
                  <Accordion.Heading>
                    <Accordion.Trigger className="group/case flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-slate-600 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-[10deg] group-hover/case:drop-shadow-md mr-1.5" />
                        <div>
                          <h4 className="font-bold text-slate-900">Parameters</h4>
                          <p className="text-sm text-slate-600">
                            Input parameters and values used in this assessment
                          </p>
                        </div>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <div className="py-2">
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

                <Accordion.Item id="industry">
                  <Accordion.Heading>
                    <Accordion.Trigger className="group/case flex items-center justify-between w-full py-3">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 text-blue-600 transition-[scale,rotate] duration-300 ease-out group-hover/case:scale-[1.2] group-hover/case:-rotate-[10deg] group-hover/case:drop-shadow-md mr-1.5" />
                        <div>
                          <h4 className="font-bold text-slate-900">Industry</h4>
                          <p className="text-sm text-slate-600">Market or sector context</p>
                        </div>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <div className="py-2">
                        <p className="text-sm text-slate-700 leading-relaxed">{industryText}</p>
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
                  <ListBox.Item id="summary">Summary</ListBox.Item>
                  <ListBox.Item id="analysis">Detailed Analysis</ListBox.Item>
                  <ListBox.Item id="recommendations">Recommendations</ListBox.Item>
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
                    <p className="text-sm text-slate-600">
                      AI-powered circularity assessment and recommendations
                    </p>
                  </div>
                  <Chip
                    variant="soft"
                    color="warning"
                    size="sm"
                    className="font-semibold text-xs px-3 py-1"
                  >
                    {actualResult.audit?.confidence_score || 0}% Confidence
                  </Chip>
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
                    <p className="text-3xl font-bold text-emerald-700">
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
                      <TrendingUp className="w-4 h-4 text-green-600" />
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
                      <Target className="w-4 h-4 text-orange-600" />
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
                      <BarChart3 className="w-4 h-4 text-blue-600" />
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
                    <Lightbulb className="w-5 h-5 text-blue-700" />
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
                            <tip.Icon className={`w-4 h-4 ${tip.iconClassName}`} />
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

            {/* Gap Analysis & Benchmarks Section */}
            {actualResult.gap_analysis?.has_benchmarks && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Your Performance vs. Similar Projects
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Benchmark comparisons from similar projects in the database
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Your Score</div>
                      <div className="text-2xl font-bold text-emerald-700">
                        {actualResult.overall_score}
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Average</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {Math.round(actualResult.gap_analysis.overall_benchmarks.average)}
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Top 10%</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {actualResult.gap_analysis.overall_benchmarks.top_10_percentile}
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Median</div>
                      <div className="text-2xl font-bold text-teal-700">
                        {actualResult.gap_analysis.overall_benchmarks.median}
                      </div>
                    </div>
                  </div>

                  {Object.keys(actualResult.gap_analysis.sub_score_gaps).length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-3">
                        Factor-by-Factor Analysis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(actualResult.gap_analysis.sub_score_gaps).map(
                          ([factor, gap]) => (
                            <div
                              key={factor}
                              className="p-4 border border-slate-200 rounded-lg bg-white"
                              style={{
                                borderLeft: gap.gap > 5 ? '4px solid #f97316' : '4px solid #10b981',
                              }}
                            >
                              <div className="text-xs font-bold text-slate-900 mb-2">
                                {factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </div>
                              <div className="flex justify-between mb-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-600">Your: </span>
                                  <span className="font-bold text-emerald-700">
                                    {gap.user_score}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-600">Avg: </span>
                                  <span className="font-bold text-blue-700">
                                    {gap.benchmark_average}
                                  </span>
                                </div>
                              </div>
                              {gap.gap > 0 ? (
                                <div className="text-xs text-orange-700 font-semibold flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" /> +{gap.gap}
                                </div>
                              ) : (
                                <div className="text-xs text-green-700 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> +{Math.abs(gap.gap)}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Industry & Metadata Section */}
            {actualResult.metadata && (
              <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
                <div className="p-1 sm:p-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <ClipboardList className="w-5 h-5 text-emerald-600" />
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
                        {titleize(actualResult.metadata.industry)}
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
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
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
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
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
                            <AlertCircle className="w-5 h-5 text-orange-600" />
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
                                  <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
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

            {/* Database Evidence - Modern Card */}
            <Card
              data-export-section="database-evidence"
              className="border border-slate-300 shadow-sm rounded-xl bg-white"
            >
              <div className="p-1 sm:p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Database Evidence</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Similar cases and benchmark comparisons from the dataset
                </p>

                <div>
                  {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
                    <div>
                      {actualResult.similar_cases.map((caseItem, index) => {
                        const caseTitle = casesSummaries[index] || `Related Case ${index + 1}`;
                        const { matchPercentage, sourceCaseId, content } = extractCaseInfo(
                          caseItem,
                          index,
                        );

                        const { problem: problemText, solution: solutionText } =
                          extractProblemSolution(caseItem);

                        const getMatchStrength = (percentage) => {
                          if (percentage >= 80)
                            return { label: 'Excellent Match', color: '#059669' };
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
                              <Chip
                                size="sm"
                                variant="secondary"
                                className="text-xs py-0.5 text-white font-bold"
                                style={{
                                  backgroundColor: matchStrength.color,
                                }}
                              >
                                {matchPercentage}%&nbsp;&nbsp;Similarity
                              </Chip>
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

                            <div className="flex items-center justify-center">
                              <button
                                className="mt-1 mb-6 bg-none border-none text-emerald-600 font-semibold cursor-pointer p-2 px-0 text-sm transition-colors hover:text-emerald-700 hover:underline flex items-center gap-1"
                                onClick={() =>
                                  openResultsDatabaseEvidenceDetailsDrawer({
                                    caseItem,
                                    content,
                                    title: caseTitle,
                                    matchPercentage,
                                    matchStrengthLabel: matchStrength.label,
                                    matchColor: matchStrength.color,
                                    sourceCaseId,
                                  })
                                }
                              >
                                View Full Details&nbsp;
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
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
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
                          <AlertCircle className="w-4 h-4 text-orange-600" />
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
