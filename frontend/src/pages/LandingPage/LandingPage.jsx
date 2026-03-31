import { Accordion, toast, Tooltip } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeInfo,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

// Session restore is handled globally via AppSessionManager + SessionRestoreDialog
import { Button } from '@/components/common';
import LoaderIcon from '@/components/common/LoaderIcon';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { useSession } from '@/features/session/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { loadEvaluationState } from '@/lib/storage';
import { getCharacterCount } from '@/lib/validation';
import BusinessContextContainer from '@/pages/LandingPage/components/BusinessContextContainer';
import BusinessInputField from '@/pages/LandingPage/components/BusinessInputField';
import EvaluationParametersContainer from '@/pages/LandingPage/components/EvaluationParametersContainer';
import FeatureCards from '@/pages/LandingPage/components/FeatureCards';
import HeroSection from '@/pages/LandingPage/components/HeroSection';
import MethodologyButtons from '@/pages/LandingPage/components/MethodologyButtons';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';
import { inputsEqual, nonLetterDensity, uniqueWordRatio } from '@/utils/formHelpers';

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    hasEvaluationState,
    restoreEvaluation,
    clearEvaluation,
    saveEvaluation,
    hasRestorableSession,
    sessionData,
    saveSession,
    clearSession,
  } = useSession();
  const { openLimitReachedDialog } = useGlobalDialog();
  const {
    openAssessmentMethodologyDrawer,
    openEvaluationCriteriaDrawer,
    openBusinessProblemInfoDrawer,
    openBusinessSolutionInfoDrawer,
    openEvaluationParametersHeadingInfoDrawer,
    openBusinessContextHeadingInfoDrawer,
    openSampleTestCasesHeadingInfoDrawer,
  } = useGlobalDrawer();

  const [showEvaluationParameters, setShowEvaluationParameters] = useState(true);
  const [loading, setLoading] = useState(false);

  // Controlled accordion state so we can imperatively open them (e.g. on test case select)
  const [evalParamsExpandedKeys, setEvalParamsExpandedKeys] = useState(
    new Set(['evaluation-parameters-heading']),
  );
  const [businessContextExpandedKeys, setBusinessContextExpandedKeys] = useState(
    new Set(['business-context-heading']),
  );
  const ALL_INNER_KEYS = new Set(['Access Value', 'Embedded Value', 'Processing Value']);
  const [innerExpandedKeys, setInnerExpandedKeys] = useState(new Set(ALL_INNER_KEYS));

  const openEvalParams = () => {
    setEvalParamsExpandedKeys(new Set(['evaluation-parameters-heading']));
    setInnerExpandedKeys(new Set(ALL_INNER_KEYS));
  };

  const openBusinessContext = () => {
    setBusinessContextExpandedKeys(new Set(['business-context-heading']));
  };

  const [error, setError] = useState(null);
  // session prompt handled globally in AppSessionManager
  const skipAutosaveRef = useRef(false);
  const businessProblemSectionRef = useRef(null);
  // container ref used for focusout -> flush autosave
  const formContainerRef = useRef(null);

  const methods = useForm({
    resolver: zodResolver(assessmentSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { isValid },
  } = methods;

  // Prefetch ResultsPage bundle when form becomes valid to reduce navigation delay
  useEffect(() => {
    if (isValid) {
      // Start prefetching the ResultsPage bundle in the background
      import('@/pages/ResultsPage/ResultsPage').catch((err) => {
        logger.warn('Failed to prefetch ResultsPage:', err);
      });
    }
  }, [isValid]);

  // Use refs + onChange handlers to debounce autosave without subscribing the whole
  // component to form changes (avoids re-renders on each keystroke).
  const autosaveTimerRef = useRef(null);

  // Session restoration is handled globally; landing page listens for navigation-state restore

  // Pre-fill form with data from ResultsPage (reevaluate)
  useEffect(() => {
    if (location.state?.formData) {
      const { businessProblem, businessSolution, evaluation_parameters, businessContext } =
        location.state.formData;
      reset({
        businessProblem: businessProblem || '',
        businessSolution: businessSolution || '',
        evaluation_parameters: evaluation_parameters || {},
        businessContext: businessContext || {},
      });
      // Open the evaluation parameters panel
      setShowEvaluationParameters(true);

      // Scroll to business problem section after a short delay
      setTimeout(() => {
        businessProblemSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        // Show toast notification after scrolling starts
        setTimeout(() => {
          toast.info('Assessment Loaded', {
            description: 'Your previous assessment has been loaded for re-evaluation.',
            timeout: 3000,
          });
        }, 300);
      }, 100);

      // Clear the location state to prevent re-filling on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [location.state, reset]);

  // Ensure LandingPage inputs are always synced from persisted session state
  // when navigating (SPA navigation). Navigation-state (location.state.formData)
  // takes precedence and won't be overridden by the persisted session here.
  // Sync persisted session inputs into the form, but do NOT overwrite
  // when the user has local edits that are newer than the persisted state.
  // This prevents stale session data from clobbering active edits.
  const lastAppliedSessionRef = useRef(null);
  // Timestamp of the last local save (set when persistInputs saves to localStorage).
  // Used to prevent older persisted sessions from overwriting newer local edits.
  const lastSavedLocalTimestampRef = useRef(null);

  useEffect(() => {
    if (location.state?.formData) return; // navigation state has priority
    const sessionInputs = sessionData?.inputs;
    if (!sessionInputs) return;

    // If the persisted session is older than a local save we performed, ignore it.
    // This prevents a timing window where persistInputs updates localStorage but
    // the useSession hook hasn't refetched yet and an older sessionData value
    // would otherwise overwrite the user's active edits.
    try {
      const persistedTs = sessionData?.timestamp ? new Date(sessionData.timestamp) : null;
      const lastLocalSaveTs = lastSavedLocalTimestampRef.current
        ? new Date(lastSavedLocalTimestampRef.current)
        : null;
      if (persistedTs && lastLocalSaveTs && persistedTs <= lastLocalSaveTs) {
        return; // incoming persisted data is stale compared to our last local save
      }
    } catch (err) {
      // ignore parsing errors and fall back to previous logic
    }

    // Helper to compare input shapes (supports both legacy and new naming)
    const currentForm = methods.getValues();

    // If the current form already matches session inputs, just update lastApplied
    if (inputsEqual(currentForm, sessionInputs)) {
      lastAppliedSessionRef.current = sessionInputs;
      return;
    }

    // If we've never applied session state before, apply it now (initial load)
    if (!lastAppliedSessionRef.current) {
      reset({
        businessProblem: sessionInputs.businessProblem || '',
        businessSolution: sessionInputs.businessSolution || '',
        evaluationParameters: sessionInputs.evaluationParameters || {},
        businessContext: sessionInputs.businessContext || {},
      });
      setShowEvaluationParameters(true);
      skipAutosaveRef.current = true;
      lastAppliedSessionRef.current = sessionInputs;
      return;
    }

    // If the current form equals the lastApplied snapshot, it means the user
    // hasn't edited since we last synced — safe to overwrite with new sessionData.
    if (inputsEqual(currentForm, lastAppliedSessionRef.current)) {
      reset({
        businessProblem: sessionInputs.businessProblem || '',
        businessSolution: sessionInputs.businessSolution || '',
        evaluationParameters: sessionInputs.evaluationParameters || {},
        businessContext: sessionInputs.businessContext || {},
      });
      setShowEvaluationParameters(true);
      skipAutosaveRef.current = true;
      lastAppliedSessionRef.current = sessionInputs;
      return;
    }

    // Otherwise: user has local edits more recent than persisted session — do nothing.
  }, [sessionData, location.state, reset, methods]);

  useEffect(() => {
    // Session restore prompt display is handled globally via AppSessionManager
  }, [hasEvaluationState, hasRestorableSession]);

  const { user } = useAuth();

  // Debounced autosave using getValues inside delayed callback.
  // IMPORTANT: session.inputs and session.results are independent entities:
  // - session.inputs: Mutable user input (editable, changes on every keystroke)
  // - session.results: Immutable snapshot (includes businessProblem/Solution/params used to calculate it)
  // Reduced debounce to make UI feel more responsive and add a synchronous
  // flush path for blur / beforeunload to eliminate perceived lag.
  const AUTOSAVE_DEBOUNCE_MS = 150;

  const persistInputs = useCallback(
    (values) => {
      // Normalized current values
      const current = {
        businessProblem: (values?.businessProblem || '').trim(),
        businessSolution: (values?.businessSolution || '').trim(),
        evaluationParameters: values?.evaluationParameters || {},
        businessContext: values?.businessContext || {},
      };

      // Stored inputs (read directly from localStorage to avoid useSession timing races)
      const storedState = loadEvaluationState();
      const stored = storedState?.inputs || {
        businessProblem: '',
        businessSolution: '',
        evaluationParameters: {},
        businessContext: {},
      };

      const inputsEqualLocal = inputsEqual;

      // If nothing changed vs persisted state, skip writing to storage
      if (inputsEqualLocal(current, stored)) return;

      // Persist current inputs (this intentionally writes empty strings when user cleared fields)
      const savedAt = new Date().toISOString();
      saveSession({
        inputs: {
          businessProblem: values.businessProblem || '',
          businessSolution: values.businessSolution || '',
          evaluationParameters: values.evaluationParameters || {},
          businessContext: values.businessContext || {},
        },
        timestamp: savedAt,
      });

      try {
        // mark when we last saved locally (used by the session-sync guard)
        lastSavedLocalTimestampRef.current = savedAt;
        // update lastApplied snapshot so new persisted sessions won't overwrite active edits
        const snapshot = {
          businessProblem: values.businessProblem || '',
          businessSolution: values.businessSolution || '',
          evaluationParameters: values.evaluationParameters || {},
          businessContext: values.businessContext || {},
        };
        lastAppliedSessionRef.current = snapshot;
      } catch (err) {
        logger.warn('Failed to update lastAppliedSessionRef after saving session:', err);
      }
    },
    [saveSession],
  );

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (skipAutosaveRef.current) {
        skipAutosaveRef.current = false;
        autosaveTimerRef.current = null;
        return;
      }

      const values = methods.getValues();
      persistInputs(values);
      autosaveTimerRef.current = null;
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [methods, persistInputs]);

  // Synchronously persist current form values (used on blur / beforeunload)
  const flushAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    // Persist synchronously
    try {
      const values = methods.getValues();
      persistInputs(values);
    } catch (err) {
      // swallow - form may be unmounted
      logger.warn('flushAutosave failed', err);
    }
  }, [methods, persistInputs]);

  // Watch for form changes and trigger autosave
  useEffect(() => {
    if (!methods?.watch) return;
    const subscription = methods.watch(() => {
      scheduleAutosave();
    });
    return () => subscription?.unsubscribe?.();
  }, [methods, scheduleAutosave]);

  // Clean up autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // Flush autosave on focus leave inside the landing page to avoid "invisible"
  // delays between user edit and persistence.
  useEffect(() => {
    const el = formContainerRef.current;
    if (!el) return undefined;

    const onFocusOut = (ev) => {
      // flush synchronously when user leaves an input inside the page
      flushAutosave();
    };

    el.addEventListener('focusout', onFocusOut);
    return () => el.removeEventListener('focusout', onFocusOut);
  }, [flushAutosave]);

  // Warn the user when they try to close/refresh the page with unsaved inputs.
  useEffect(() => {
    const shouldWarn = () => {
      const values = methods.getValues();
      const persisted = loadEvaluationState();
      const stored = persisted?.inputs ||
        sessionData?.inputs || {
          businessProblem: '',
          businessSolution: '',
          evaluationParameters: {},
          businessContext: {},
        };

      // If the current form already matches persisted inputs, DO NOT warn
      if (inputsEqual(values, stored)) return false;

      // Warn when there is a pending autosave OR unsaved edits are present.
      return Boolean(autosaveTimerRef.current) || !inputsEqual(values, stored);
    };

    const handler = (e) => {
      if (!shouldWarn()) return;

      // Persist any pending work before deciding whether to show a browser prompt.
      flushAutosave();

      const values = methods.getValues();
      const persisted = loadEvaluationState();
      const stored = persisted?.inputs ||
        sessionData?.inputs || {
          businessProblem: '',
          businessSolution: '',
          evaluationParameters: {},
          businessContext: {},
        };

      // If sync succeeded and inputs now match persisted state, no prompt needed.
      if (!inputsEqual(values, stored)) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }

      return;
    };

    window.addEventListener('beforeunload', handler);
    // pagehide gives us a chance to synchronously persist on SPA-style navigations
    window.addEventListener('pagehide', flushAutosave);

    return () => {
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('pagehide', flushAutosave);
    };
  }, [methods, sessionData, flushAutosave]);

  const handleFormSubmit = async (formData) => {
    // Validate minimum character requirements
    if (getCharacterCount(formData.businessProblem) < 200) {
      toast.danger('Business Problem is too short', {
        description: 'Please provide at least 200 characters for the business problem description.',
        timeout: 4000,
      });
      return;
    }

    if (getCharacterCount(formData.businessSolution) < 200) {
      toast.danger('Business Solution is too short', {
        description:
          'Please provide at least 200 characters for the business solution description.',
        timeout: 4000,
      });
      return;
    }

    // Client-side junk detection: low unique-word ratio or too many symbols
    const probUniq = uniqueWordRatio(formData.businessProblem);
    const solUniq = uniqueWordRatio(formData.businessSolution);
    if (probUniq < 0.3 || solUniq < 0.3) {
      const msg =
        'Your inputs look repetitive or low-information. Please provide more specific detail in both problem and solution.';
      setError(msg);
      toast.danger('Input validation', { description: msg, timeout: 4000 });
      return;
    }

    if (
      nonLetterDensity(formData.businessProblem) > 0.25 ||
      nonLetterDensity(formData.businessSolution) > 0.25
    ) {
      const msg =
        'Your inputs contain excessive non-text characters. Please provide plain-language descriptions.';
      setError(msg);
      toast.danger('Input validation', { description: msg, timeout: 4000 });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await scoreAssessment(formData);

      // Persist inputs (unchanged behavior) and save the full result snapshot
      // returned by the backend (the `result` now includes businessProblem,
      // businessSolution and parameters so the snapshot is self-contained).
      saveSession({
        inputs: {
          businessProblem: formData.businessProblem,
          businessSolution: formData.businessSolution,
          evaluationParameters: formData.evaluationParameters || {},
          businessContext: formData.businessContext || {},
        },
        results: result,
      });

      toast.success('Assessment complete!', {
        description: 'Your circularity evaluation has been generated successfully.',
        timeout: 3000,
      });

      // Navigate to Results with only the `result` because it is now self-contained
      // (frontend will read problem/solution/parameters from `result` if formData is not provided)
      navigate('/results', { state: { result } });
    } catch (err) {
      // Handle anonymous limit reached
      if (err?.code === 'LIMIT_REACHED') {
        openLimitReachedDialog({
          limit: err?.limit || 20,
          message:
            err?.message ||
            `You've reached the limit of free evaluations. Create an account to continue assessing your circular economy initiatives!`,
        });
        try {
          // clearSession();
        } catch (e) {
          logger.error('Failed to clear session after limit reached:', e);
        }
        return;
      }

      const errorMessage = err?.message || err?.error || 'An unexpected error occurred';
      setError(errorMessage);
      toast.danger('Evaluation failed', {
        description: errorMessage,
        timeout: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div ref={formContainerRef} className="w-full max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <HeroSection />

        {/* Methodology Buttons */}
        <MethodologyButtons
          openAssessmentMethodologyDrawer={openAssessmentMethodologyDrawer}
          openEvaluationCriteriaDrawer={openEvaluationCriteriaDrawer}
        />

        {/* Feature Cards */}
        <FeatureCards />

        {/* Input Form — no card wrapper, floats directly on page bg */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div ref={businessProblemSectionRef} className="space-y-6">
            {/* Section heading */}
            <div className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2
                className="heading-display text-[22px] mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                Evaluate Your Circular Economy Business
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Describe your business idea using the same structure as real circular economy
                projects: what problem you solve, and how your solution addresses it.
              </p>
            </div>

            {/* Business Problem and Solution — same grid layout, no card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BusinessInputField
                id="business-problem"
                label="Business Problem"
                description="What environmental or circular economy challenge does your business address?"
                placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually..."
                fieldName="businessProblem"
                register={register}
                onInfoClick={openBusinessProblemInfoDrawer}
                loading={loading}
                flushAutosave={flushAutosave}
                rows={4}
                minLength={200}
              />
              <BusinessInputField
                id="business-solution"
                label="Business Solution"
                description="How does your business solve this problem? Include materials, processes, and circularity strategy."
                placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste..."
                fieldName="businessSolution"
                register={register}
                onInfoClick={openBusinessSolutionInfoDrawer}
                loading={loading}
                flushAutosave={flushAutosave}
                rows={5}
                minLength={200}
              />
            </div>

            {/* Business Context — keep exactly as-is (accordion in its own bordered container) */}
            <div
              className="w-full rounded-lg border overflow-hidden"
              style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
            >
              <Accordion
                className="w-full"
                variant="default"
                expandedKeys={businessContextExpandedKeys}
                onExpandedChange={setBusinessContextExpandedKeys}
              >
                <Accordion.Item id="business-context-heading">
                  <Accordion.Heading>
                    <Accordion.Trigger className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-accent-soft">
                      <BriefcaseBusiness
                        className="h-6 w-6 shrink-0 mr-1"
                        style={{ color: 'var(--accent)' }}
                        strokeWidth={1.75}
                      />

                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold text-lg leading-6"
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            Business Context
                          </span>
                          <BadgeInfo
                            className="info-icon cursor-pointer"
                            size={22}
                            style={{ color: 'var(--accent)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openBusinessContextHeadingInfoDrawer();
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-normal leading-4"
                          style={{ color: 'var(--muted)' }}
                        >
                          Optional — improves analysis quality
                        </span>
                      </div>

                      <Accordion.Indicator className="text-muted [&>svg]:size-4">
                        <ChevronDown />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>

                  <Accordion.Panel>
                    <Accordion.Body className="p-0 bg-transparent">
                      <BusinessContextContainer loading={loading} />
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </div>

            {/* Evaluation Parameters — keep exactly as-is */}
            <div
              className="w-full rounded-lg border overflow-hidden"
              style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
            >
              <Accordion
                className="w-full"
                variant="default"
                allowsMultipleExpanded
                expandedKeys={evalParamsExpandedKeys}
                onExpandedChange={setEvalParamsExpandedKeys}
              >
                <Accordion.Item id="evaluation-parameters-heading">
                  <Accordion.Heading>
                    <Accordion.Trigger className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-accent-soft">
                      <SlidersHorizontal
                        className="h-6 w-6 shrink-0 mr-1"
                        style={{ color: 'var(--success)' }}
                        strokeWidth={1.75}
                      />

                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold text-lg leading-6"
                            style={{
                              color: 'var(--foreground)',
                            }}
                          >
                            Evaluation Parameters
                          </span>
                          <BadgeInfo
                            className="info-icon cursor-pointer"
                            size={22}
                            style={{ color: 'var(--accent)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEvaluationParametersHeadingInfoDrawer();
                            }}
                          />
                        </div>
                        <span
                          className="text-sm font-normal leading-4"
                          style={{ color: 'var(--muted)' }}
                        >
                          Score each dimension of circular value
                        </span>
                      </div>

                      <Accordion.Indicator className="text-muted [&>svg]:size-4">
                        <ChevronDown />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>

                  <Accordion.Panel>
                    <Accordion.Body className="p-0 bg-transparent">
                      <EvaluationParametersContainer
                        loading={loading}
                        innerExpandedKeys={innerExpandedKeys}
                        onInnerExpandedChange={setInnerExpandedKeys}
                      />
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </div>

            {/* Error and Submit — keep exactly as-is */}
            {error && (
              <div
                className="p-3 sm:p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--danger-soft)',
                  borderColor: 'var(--danger-border)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    className="shrink-0"
                    style={{ color: 'var(--danger)' }}
                    strokeWidth={2.5}
                    size={16}
                  />
                  <strong className="font-semibold" style={{ color: 'var(--danger)' }}>
                    Validation Error:
                  </strong>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                  {error}, please try again.
                </p>
              </div>
            )}

            {/* Submit Button — keep exactly as-is */}
            <div className="w-full">
              <Tooltip delay={0} isDisabled={isValid}>
                <Tooltip.Trigger>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={handleSubmit(handleFormSubmit)}
                    isDisabled={loading || !isValid}
                    fullWidth
                    className="h-12 text-sm font-medium"
                    style={{
                      backgroundColor: loading || !isValid ? 'var(--muted)' : 'var(--accent)',
                      color:
                        loading || !isValid
                          ? 'var(--muted-foreground)'
                          : 'var(--accent-foreground)',
                    }}
                  >
                    {loading ? (
                      <LoaderIcon isButton={true} color="var(--surface)" />
                    ) : (
                      <span>Evaluate Circularity</span>
                    )}
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content showArrow placement="top" className="text-center">
                  <Tooltip.Arrow />
                  <span>
                    Please fill out business problem and solution fields (min. 200 chars each)
                  </span>
                </Tooltip.Content>
              </Tooltip>
            </div>

            {/* Sample Test Cases — keep exactly as-is */}
            <div
              className="w-full rounded-lg border p-5"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <ClipboardList
                  className="h-6 w-6 shrink-0"
                  style={{ color: 'var(--success)' }}
                  strokeWidth={1.75}
                />

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-base leading-6"
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Sample Test Cases
                    </span>
                    <BadgeInfo
                      className="info-icon cursor-pointer"
                      size={22}
                      style={{ color: 'var(--accent)' }}
                      onClick={openSampleTestCasesHeadingInfoDrawer}
                    />
                  </div>
                  <span
                    className="text-xs font-normal leading-4 italic"
                    style={{ color: 'var(--muted)' }}
                  >
                    Auto-fill the form with curated examples for quick testing
                  </span>
                </div>
              </div>

              <SampleTestCasesContainer
                setShowEvaluationParameters={setShowEvaluationParameters}
                openEvalParams={openEvalParams}
                openBusinessContext={openBusinessContext}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </FormProvider>
  );
}

LandingPage.propTypes = {};
