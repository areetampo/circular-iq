import { Accordion, toast, Tooltip } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { BadgeInfo, ChevronDown, ClipboardList, MonitorCog, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { ButtonStages, DetailsBadge } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { evaluationFormDefaults, evaluationFormSchema } from '@/features/assessments/validation';
import { useSession } from '@/features/session';
import { useLoadingStages } from '@/hooks';
import { loadEvaluationState } from '@/lib/storage';
import { getCharacterCount } from '@/lib/validation';
import { dominantCharRatio, nonLetterDensity, uniqueWordRatio } from '@/utils/formHelpers';

import {
  BusinessContextContainer,
  BusinessInputField,
  EvaluationParametersContainer,
  HeroSection,
  SampleTestCasesContainer,
} from './components';

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionData, saveSession } = useSession();
  const { openLimitReachedDialog } = useGlobalDialog();
  const { currentStage, startStream, reset: resetProgress } = useLoadingStages();
  const {
    openAssessmentMethodologyDrawer,
    openEvaluationCriteriaDrawer,
    openBusinessProblemInfoDrawer,
    openBusinessSolutionInfoDrawer,
    openEvaluationParametersHeadingInfoDrawer,
    openBusinessContextHeadingInfoDrawer,
    openSampleTestCasesHeadingInfoDrawer,
  } = useGlobalDrawer();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const methods = useForm({
    resolver: zodResolver(evaluationFormSchema),
    mode: 'onChange',
    defaultValues: evaluationFormDefaults,
  });

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { isValid },
  } = methods;

  // Get specific validation error message based on form state
  const getValidationErrorMessage = useCallback(() => {
    const problemValue = methods.getValues('businessProblem') || '';
    const solutionValue = methods.getValues('businessSolution') || '';

    const problemCount = getCharacterCount(problemValue);
    const solutionCount = getCharacterCount(solutionValue);
    const problemMeetsMin = problemCount >= 200;
    const solutionMeetsMin = solutionCount >= 200;

    // Check quality issues
    const problemUniq = uniqueWordRatio(problemValue);
    const solutionUniq = uniqueWordRatio(solutionValue);
    const problemNonLetter = nonLetterDensity(problemValue);
    const solutionNonLetter = nonLetterDensity(solutionValue);
    const problemDominant = dominantCharRatio(problemValue);
    const solutionDominant = dominantCharRatio(solutionValue);

    if (!problemMeetsMin && !solutionMeetsMin) {
      return 'Both problem and solution need at least 200 characters (excluding spaces)';
    }

    if (!problemMeetsMin && solutionMeetsMin) {
      return 'Problem needs at least 200 characters (excluding spaces)';
    }

    if (problemMeetsMin && !solutionMeetsMin) {
      return 'Solution needs at least 200 characters (excluding spaces)';
    }

    const issues = [];
    if (problemUniq < 0.3) issues.push('problem is repetitive');
    if (solutionUniq < 0.3) issues.push('solution is repetitive');
    if (problemNonLetter > 0.25) issues.push('problem has too many symbols');
    if (solutionNonLetter > 0.25) issues.push('solution has too many symbols');
    if (problemDominant > 0.5) issues.push('problem has repetitive characters');
    if (solutionDominant > 0.5) issues.push('solution has repetitive characters');

    if (issues.length > 0) {
      return `Issues found: ${issues.join(', ')}`;
    }

    return null; // All good
  }, [methods]);

  // Quality validation function (mirrors backend logic)
  const validateInputQuality = useCallback((problem, solution) => {
    const minLength = 50; // Reasonable minimum for detailed input

    if (!problem || !solution) {
      return { isJunk: true, reason: 'Missing problem or solution' };
    }

    if (problem.length < minLength || solution.length < minLength) {
      return { isJunk: true, reason: 'Input too short to be meaningful' };
    }

    // Check for obvious spam/junk patterns
    const junkPatterns = [/^[a-z]{1,3}$/i, /^-{3,}$/, /^x{3,}$/, /^(test|lorem|ipsum)/i];
    if (junkPatterns.some((pattern) => pattern.test(problem) || pattern.test(solution))) {
      return { isJunk: true, reason: 'Input matches junk patterns' };
    }

    // Detect single-character flooding (e.g. "AAAA..." or "1111...")
    const probDominant = dominantCharRatio(problem);
    const solDominant = dominantCharRatio(solution);
    if (probDominant > 0.5 || solDominant > 0.5) {
      return {
        isJunk: true,
        reason: 'Input appears to be repetitive characters; please provide a real description.',
      };
    }

    // Low uniqueness detection: many repeated words or filler
    const probUniq = uniqueWordRatio(problem);
    const solUniq = uniqueWordRatio(solution);
    if (probUniq < 0.3 || solUniq < 0.3) {
      return {
        isJunk: true,
        reason:
          'Input appears repetitive or low-information; please provide more detailed, specific descriptions.',
      };
    }

    // Non-letter density check (too many symbols/characters suggests junk)
    if (nonLetterDensity(problem) > 0.25 || nonLetterDensity(solution) > 0.25) {
      return {
        isJunk: true,
        reason:
          'Input contains excessive non-text characters; please provide plain-language descriptions.',
      };
    }

    return null;
  }, []);

  // State and refs for full session autosave logic
  const skipAutosaveRef = useRef(false);
  const lastAppliedSessionRef = useRef(null);
  const lastSavedLocalTimestampRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const reevaluateDataAppliedRef = useRef(false);
  const AUTOSAVE_DEBOUNCE_MS = 150;

  // Accordion state management
  const [businessContextExpandedKeys, setBusinessContextExpandedKeys] = useState(
    new Set(['business-context-heading']),
  );
  const [evalParamsExpandedKeys, setEvalParamsExpandedKeys] = useState(
    new Set([
      'evaluation-parameters-heading',
      'Access Value',
      'Embedded Value',
      'Processing Value',
    ]),
  );
  const [sampleTestCasesExpandedKeys, setSampleTestCasesExpandedKeys] = useState(
    new Set(['test-cases']),
  );
  const formContainerRef = useRef(null);

  // Full session autosave logic implementation
  const persistInputs = useCallback(
    (values) => {
      if (skipAutosaveRef.current) return;

      const current = {
        businessProblem: (values?.businessProblem || '').trim(),
        businessSolution: (values?.businessSolution || '').trim(),
        evaluationParameters: values?.evaluationParameters || {},
        businessContext: values?.businessContext || {},
      };

      // Read directly from localStorage to avoid useSession timing race
      let stored;
      try {
        const storedState = loadEvaluationState();
        stored = storedState?.inputs || {
          businessProblem: '',
          businessSolution: '',
          evaluationParameters: {},
          businessContext: {},
        };
      } catch {
        stored = {
          businessProblem: '',
          businessSolution: '',
          evaluationParameters: {},
          businessContext: {},
        };
      }

      // Skip write if nothing changed
      const same = (a, b) => {
        try {
          return (
            (a.businessProblem || '').trim() === (b.businessProblem || '').trim() &&
            (a.businessSolution || '').trim() === (b.businessSolution || '').trim() &&
            JSON.stringify(a.evaluationParameters || {}) ===
              JSON.stringify(b.evaluationParameters || {}) &&
            JSON.stringify(a.businessContext || {}) === JSON.stringify(b.businessContext || {})
          );
        } catch {
          return false;
        }
      };

      if (same(current, stored)) return;

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
        lastSavedLocalTimestampRef.current = savedAt;
        lastAppliedSessionRef.current = {
          businessProblem: values.businessProblem || '',
          businessSolution: values.businessSolution || '',
          evaluationParameters: values.evaluationParameters || {},
          businessContext: values.businessContext || {},
        };
      } catch {
        /* ignore */
      }
    },
    [saveSession],
  );

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      const values = methods.getValues();
      persistInputs(values);
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [methods, persistInputs, AUTOSAVE_DEBOUNCE_MS]);

  const flushAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    const values = methods.getValues();
    persistInputs(values);
  }, [methods, persistInputs]);

  // Callbacks for SampleTestCasesContainer
  const openEvalParams = () => {
    setEvalParamsExpandedKeys(
      new Set([
        'evaluation-parameters-heading',
        'Access Value',
        'Embedded Value',
        'Processing Value',
      ]),
    );
  };

  const openBusinessContext = () => {
    setBusinessContextExpandedKeys(new Set(['business-context-heading']));
  };

  // Session sync useEffect
  useEffect(() => {
    const sessionToApply = sessionData;
    if (!sessionToApply) return;

    // Skip if we already applied this session
    if (lastAppliedSessionRef.current === sessionToApply) return;

    // Skip if re-evaluate data was applied - preserve user's re-evaluate choice
    if (reevaluateDataAppliedRef.current) return;

    // Skip if local changes are newer
    if (
      lastSavedLocalTimestampRef.current &&
      sessionToApply.timestamp &&
      lastSavedLocalTimestampRef.current > sessionToApply.timestamp
    ) {
      return;
    }

    skipAutosaveRef.current = true;
    try {
      const inputs = sessionToApply.inputs || {};
      reset({
        businessProblem: inputs.businessProblem || '',
        businessSolution: inputs.businessSolution || '',
        evaluationParameters: inputs.evaluationParameters || {},
        businessContext: inputs.businessContext || {},
      });
      lastAppliedSessionRef.current = sessionToApply;
    } finally {
      skipAutosaveRef.current = false;
    }
  }, [sessionData, location.state?.formData, reset, methods]);

  // Watch subscription useEffect
  useEffect(() => {
    const subscription = watch(() => {
      scheduleAutosave();
    });
    return () => subscription.unsubscribe();
  }, [watch, scheduleAutosave]);

  // Cleanup useEffect for timer
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Focusout useEffect on formContainerRef
  useEffect(() => {
    const handleFocusOut = (e) => {
      // Only flush if focus is leaving the form container
      if (!formContainerRef.current?.contains(e.relatedTarget)) {
        flushAutosave();
      }
    };

    const container = formContainerRef.current;
    if (container) {
      container.addEventListener('focusout', handleFocusOut, true);
      return () => {
        container.removeEventListener('focusout', handleFocusOut, true);
      };
    }
  }, [flushAutosave]);

  // Beforeunload + pagehide useEffect
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const values = methods.getValues();

      // Get current form values
      const currentFormState = {
        businessProblem: (values?.businessProblem || '').trim(),
        businessSolution: (values?.businessSolution || '').trim(),
        evaluationParameters: values?.evaluationParameters || {},
        businessContext: values?.businessContext || {},
      };

      // Get saved session state
      let savedState = null;
      try {
        savedState = loadEvaluationState()?.inputs || {
          businessProblem: '',
          businessSolution: '',
          evaluationParameters: {},
          businessContext: {},
        };
      } catch {
        savedState = {
          businessProblem: '',
          businessSolution: '',
          evaluationParameters: {},
          businessContext: {},
        };
      }

      // Get default form values for comparison
      const defaultFormState = {
        businessProblem: (evaluationFormDefaults?.businessProblem || '').trim(),
        businessSolution: (evaluationFormDefaults?.businessSolution || '').trim(),
        evaluationParameters: evaluationFormDefaults?.evaluationParameters || {},
        businessContext: evaluationFormDefaults?.businessContext || {},
      };

      // Check if current form is at default values (handles login scenario)
      const isAtDefaults =
        currentFormState.businessProblem === defaultFormState.businessProblem &&
        currentFormState.businessSolution === defaultFormState.businessSolution &&
        JSON.stringify(currentFormState.evaluationParameters) ===
          JSON.stringify(defaultFormState.evaluationParameters) &&
        JSON.stringify(currentFormState.businessContext) ===
          JSON.stringify(defaultFormState.businessContext);

      // Compare current form state with saved state
      const hasUnsavedChanges =
        currentFormState.businessProblem !== savedState.businessProblem ||
        currentFormState.businessSolution !== savedState.businessSolution ||
        JSON.stringify(currentFormState.evaluationParameters) !==
          JSON.stringify(savedState.evaluationParameters) ||
        JSON.stringify(currentFormState.businessContext) !==
          JSON.stringify(savedState.businessContext);

      // Only show alert if there are unsaved changes AND there's actually content to lose
      // AND the form is not at default values (prevents false alerts after login)
      const hasContentToLose =
        currentFormState.businessProblem ||
        currentFormState.businessSolution ||
        Object.keys(currentFormState.evaluationParameters).length > 0 ||
        Object.keys(currentFormState.businessContext).length > 0;

      // Don't show alert if form is at default values (handles login scenario)
      if (isAtDefaults) {
        return;
      }

      // Debug logging
      logger.log('BeforeUnload Debug:', {
        currentFormState,
        savedState,
        defaultFormState,
        hasUnsavedChanges,
        hasContentToLose,
        isAtDefaults,
      });

      if (hasUnsavedChanges && hasContentToLose) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePageHide = () => {
      // Force immediate save without debounce
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      const values = methods.getValues();
      persistInputs(values);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [methods, flushAutosave, loadEvaluationState, persistInputs]);

  // Prefetch ResultsPage bundle when form becomes valid
  useEffect(() => {
    if (isValid) {
      import('@/pages/ResultsPage/ResultsPage').catch((err) => {
        logger.warn('Failed to prefetch ResultsPage:', err);
      });
    }
  }, [isValid]);

  // Pre-fill form with data from ResultsPage (reevaluate)
  useEffect(() => {
    if (location.state?.formData && !reevaluateDataAppliedRef.current) {
      const { businessProblem, businessSolution, evaluation_parameters, businessContext } =
        location.state.formData;

      logger.info('LandingPage: Received re-evaluate data:', location.state.formData);
      logger.info('LandingPage: Extracted businessContext:', businessContext);

      // Mark that re-evaluate data is being applied BEFORE any other processing
      reevaluateDataAppliedRef.current = true;

      const newFormData = {
        businessProblem: businessProblem || '',
        businessSolution: businessSolution || '',
        evaluationParameters: evaluation_parameters || {},
        businessContext: businessContext || {},
      };

      logger.info('LandingPage: Form data to reset:', newFormData);

      reset(newFormData);
      window.history.replaceState({}, document.title);

      // Small delay to ensure form reset completes before setting ready state
      setTimeout(() => {
        persistInputs(newFormData);
      }, 100);

      // Scroll to form when re-evaluating
      setTimeout(() => {
        const formElement = document.getElementById('ce-assessment-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Show toast notification
      toast.success('Form filled with assessment data', { timeout: 3000 });
    }
  }, [location.state?.formData, persistInputs, reset]);

  const handleFormSubmit = async (formData) => {
    // Validate minimum character requirements (excluding spaces)
    if (getCharacterCount(formData.businessProblem) < 200) {
      toast.danger('Business Problem is too short', {
        description:
          'Please provide at least 200 characters for business problem description (excluding spaces).',
        timeout: 3000,
      });
      return;
    }

    if (getCharacterCount(formData.businessSolution) < 200) {
      toast.danger('Business Solution is too short', {
        description:
          'Please provide at least 200 characters for business solution description (excluding spaces).',
        timeout: 3000,
      });
      return;
    }

    // Validate input quality (mirrors backend logic)
    const qualityCheck = validateInputQuality(formData.businessProblem, formData.businessSolution);
    if (qualityCheck) {
      toast.danger('Input Quality Issue', {
        description: qualityCheck.reason,
        timeout: 4000,
      });
      return;
    }

    setLoading(true);
    setError(null);

    startStream(formData, {
      onComplete: (result) => {
        setLoading(false);
        resetProgress();
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

        navigate('/results', { state: { result } });
      },
      onError: (err) => {
        setLoading(false);
        resetProgress();

        // Handle anonymous limit reached
        if (err?.code === 'LIMIT_REACHED') {
          openLimitReachedDialog();
          return;
        }

        const errorMessage = err?.message || err?.error || 'An unexpected error occurred';
        setError(errorMessage);
        toast.danger('Evaluation failed', {
          description: errorMessage,
          timeout: 3000,
        });
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-transparent">
        <HeroSection
          openAssessmentMethodologyDrawer={openAssessmentMethodologyDrawer}
          openEvaluationCriteriaDrawer={openEvaluationCriteriaDrawer}
        />

        {/* Assessment Form */}
        <section id="assessment-form" className="py-12">
          <div className="mx-auto max-w-4xl px-6" ref={formContainerRef}>
            {/* Section heading */}
            <div className="mb-10">
              <h2 className="mb-2 font-sans! text-[1.375rem] tracking-tight text-(--color-text-primary)">
                Evaluate Your Circular Economy Business
              </h2>
              <p className="text-[0.8438rem] leading-relaxed text-(--color-text-secondary)">
                Describe your business idea using the same structure as real circular economy
                projects: what problem you solve, and how your solution addresses it.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              <div className="scroll-mt-32 space-y-8" id="ce-assessment-form">
                {/* Business Problem */}
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
                  rows={5}
                  minLength={200}
                />

                {/* Business Solution */}
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
                  rows={6}
                  minLength={200}
                />

                {/* Business Context */}
                <div className="group/bcacc w-full overflow-hidden rounded-xl border border-(--color-border-strong) bg-[oklch(0.99_0.008_80_/0.3)] shadow-sm transition-shadow duration-300">
                  <Accordion
                    className="w-full"
                    variant="default"
                    expandedKeys={businessContextExpandedKeys}
                    onExpandedChange={setBusinessContextExpandedKeys}
                  >
                    <Accordion.Item id="business-context-heading">
                      <Accordion.Heading>
                        <Accordion.Trigger className="flex items-center gap-3 px-5 py-3">
                          <MonitorCog
                            className="mr-1 shrink-0 text-(--color-accent) transition-[scale,rotate] duration-300 ease-out group-hover/bcacc:scale-[1.2] group-hover/bcacc:-rotate-10 group-hover/bcacc:drop-shadow-md"
                            size={24}
                            strokeWidth={2}
                          />
                          <div className="flex flex-1 flex-col gap-0.5 text-left">
                            <div className="flex items-center gap-2 py-1">
                              <span className="font-mono text-sm leading-none font-medium tracking-[-0.01em] uppercase">
                                Business Context
                              </span>
                              <BadgeInfo
                                className="icon--info text-(--color-accent)"
                                size={20}
                                strokeWidth={2}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBusinessContextHeadingInfoDrawer();
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs/4 text-(--color-text-muted)">
                              Optional — improves analysis quality
                            </span>
                          </div>
                          <Accordion.Indicator className="text-(--color-text-muted) [&>svg]:size-4">
                            <ChevronDown />
                          </Accordion.Indicator>
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="bg-transparent p-0">
                          <BusinessContextContainer loading={loading} />
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </div>

                {/* Evaluation Parameters */}
                <div className="group/epacc w-full overflow-hidden rounded-xl border border-(--color-border-strong) bg-[oklch(0.99_0.008_80/0.3)] shadow-sm transition-shadow duration-300">
                  <Accordion
                    className="w-full"
                    variant="default"
                    allowsMultipleExpanded
                    expandedKeys={evalParamsExpandedKeys}
                    onExpandedChange={setEvalParamsExpandedKeys}
                  >
                    <Accordion.Item id="evaluation-parameters-heading">
                      <Accordion.Heading>
                        <Accordion.Trigger className="flex items-center gap-3 px-5 py-3">
                          <SlidersHorizontal
                            className="mr-1 shrink-0 text-(--color-success) transition-[scale,rotate] duration-300 ease-out group-hover/epacc:scale-[1.2] group-hover/epacc:-rotate-10 group-hover/epacc:drop-shadow-md"
                            size={24}
                            strokeWidth={2}
                          />
                          <div className="flex flex-1 flex-col gap-0.5 text-left">
                            <div className="flex items-center gap-2 py-1">
                              <span className="font-mono text-sm leading-none font-medium tracking-[-0.01em] uppercase">
                                Evaluation Parameters
                              </span>
                              <BadgeInfo
                                className="icon--info text-(--color-success)"
                                size={20}
                                strokeWidth={2}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEvaluationParametersHeadingInfoDrawer();
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs/4 text-(--color-text-muted)">
                              Score each dimension of circular value
                            </span>
                          </div>
                          <Accordion.Indicator className="text-(--color-text-muted) [&>svg]:size-4">
                            <ChevronDown />
                          </Accordion.Indicator>
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="bg-transparent p-0">
                          <EvaluationParametersContainer
                            loading={loading}
                            evalParamsExpandedKeys={evalParamsExpandedKeys}
                            setEvalParamsExpandedKeys={setEvalParamsExpandedKeys}
                          />
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </div>

                {/* Submit button */}
                <div className="flex w-full flex-col items-center justify-center gap-2 rounded-full">
                  <Tooltip delay={0} isDisabled={isValid} className="w-full">
                    <Tooltip.Trigger className="w-full">
                      <ButtonStages
                        loading={loading}
                        isValid={isValid}
                        onPress={handleSubmit(handleFormSubmit)}
                        currentStage={currentStage}
                        variant="teal"
                        fullWidth
                        buttonText="Evaluate Circularity"
                        buttonTextCn="font-mono tracking-wider"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Content showArrow placement="top">
                      <span>
                        {getValidationErrorMessage() ||
                          'Please fill out business problem and solution fields (min. 200 chars each)'}
                      </span>
                    </Tooltip.Content>
                  </Tooltip>

                  {/* Error Display */}
                  {error && (
                    <DetailsBadge variant="error" message={`${error}, please try again.`} />
                  )}
                </div>

                {/* Sample Test Cases */}
                <div className="group/stcacc w-full overflow-visible rounded-xl border border-(--color-border-strong) bg-[oklch(0.99_0.008_80/0.3)] shadow-sm transition-shadow duration-300">
                  <Accordion
                    className="w-full"
                    variant="default"
                    expandedKeys={sampleTestCasesExpandedKeys}
                    onExpandedChange={setSampleTestCasesExpandedKeys}
                  >
                    <Accordion.Item id="test-cases">
                      <Accordion.Heading>
                        <Accordion.Trigger className="flex items-center gap-3 px-5 py-3">
                          <ClipboardList
                            className="mr-1 size-6 shrink-0 text-(--color-accent) transition-[scale,rotate] duration-300 ease-out group-hover/stcacc:scale-[1.2] group-hover/stcacc:-rotate-10 group-hover/stcacc:drop-shadow-md"
                            strokeWidth={1.75}
                          />
                          <div className="flex flex-1 flex-col gap-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-sans text-sm/6 tracking-[-0.01em] text-(--color-text-primary)">
                                Sample Test Cases
                              </span>
                              <BadgeInfo
                                className="icon--info mt-px text-(--color-accent)"
                                size={20}
                                strokeWidth={2}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSampleTestCasesHeadingInfoDrawer();
                                }}
                              />
                            </div>
                            <span className="text-sm/4 text-(--color-text-muted)">
                              Auto-fill form with curated examples for quick testing
                            </span>
                          </div>
                          <Accordion.Indicator className="text-(--color-text-muted) [&>svg]:size-4">
                            <ChevronDown />
                          </Accordion.Indicator>
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="overflow-visible">
                          <SampleTestCasesContainer
                            openEvalParams={openEvalParams}
                            openBusinessContext={openBusinessContext}
                          />
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </FormProvider>
  );
}

LandingPage.propTypes = {};
