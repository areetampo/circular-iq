/**
 * Main evaluation entry page — business context, parameters, and scoring stream.
 * Manages react-hook-form state, session persistence, sample test cases, and navigation to results.
 */

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

/**
 * Renders the assessment entry form, restores or autosaves draft state, and starts streamed scoring.
 */
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

  // Build one tooltip message from the same length and quality checks used before submission.
  const getValidationErrorMessage = useCallback(() => {
    const problemValue = methods.getValues('businessProblem') || '';
    const solutionValue = methods.getValues('businessSolution') || '';

    const problemCount = getCharacterCount(problemValue);
    const solutionCount = getCharacterCount(solutionValue);
    const problemMeetsMin = problemCount >= 200;
    const solutionMeetsMin = solutionCount >= 200;

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

    return null;
  }, [methods]);

  // Mirror backend junk-input checks so obvious invalid submissions fail before starting the stream.
  const validateInputQuality = useCallback((problem, solution) => {
    const minLength = 50;

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

  // Refs coordinate autosave with session rehydration without causing render loops.
  const skipAutosaveRef = useRef(false);
  const lastAppliedSessionRef = useRef(null);
  const lastSavedLocalTimestampRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const reevaluateDataAppliedRef = useRef(false);
  const AUTOSAVE_DEBOUNCE_MS = 150;

  // Keep core form accordions open by default so first-time users see required controls.
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

  const persistInputs = useCallback(
    (values) => {
      if (skipAutosaveRef.current) return;

      const current = {
        businessProblem: (values?.businessProblem || '').trim(),
        businessSolution: (values?.businessSolution || '').trim(),
        evaluationParameters: values?.evaluationParameters || {},
        businessContext: values?.businessContext || {},
      };

      // Read storage directly because useSession can lag behind fast form updates.
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

  useEffect(() => {
    const sessionToApply = sessionData;
    if (!sessionToApply) return;

    // Skip if we already applied this session
    if (lastAppliedSessionRef.current === sessionToApply) return;

    // Preserve explicit re-evaluate payloads over older session drafts.
    if (reevaluateDataAppliedRef.current) return;

    // Local edits win over older persisted snapshots.
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

  useEffect(() => {
    const subscription = watch(() => {
      scheduleAutosave();
    });
    return () => subscription.unsubscribe();
  }, [watch, scheduleAutosave]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleFocusOut = (e) => {
      // Flush only when focus leaves the form so tabbing within fields stays debounced.
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

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const values = methods.getValues();

      const currentFormState = {
        businessProblem: (values?.businessProblem || '').trim(),
        businessSolution: (values?.businessSolution || '').trim(),
        evaluationParameters: values?.evaluationParameters || {},
        businessContext: values?.businessContext || {},
      };

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

      const defaultFormState = {
        businessProblem: (evaluationFormDefaults?.businessProblem || '').trim(),
        businessSolution: (evaluationFormDefaults?.businessSolution || '').trim(),
        evaluationParameters: evaluationFormDefaults?.evaluationParameters || {},
        businessContext: evaluationFormDefaults?.businessContext || {},
      };

      const isAtDefaults =
        currentFormState.businessProblem === defaultFormState.businessProblem &&
        currentFormState.businessSolution === defaultFormState.businessSolution &&
        JSON.stringify(currentFormState.evaluationParameters) ===
          JSON.stringify(defaultFormState.evaluationParameters) &&
        JSON.stringify(currentFormState.businessContext) ===
          JSON.stringify(defaultFormState.businessContext);

      const hasUnsavedChanges =
        currentFormState.businessProblem !== savedState.businessProblem ||
        currentFormState.businessSolution !== savedState.businessSolution ||
        JSON.stringify(currentFormState.evaluationParameters) !==
          JSON.stringify(savedState.evaluationParameters) ||
        JSON.stringify(currentFormState.businessContext) !==
          JSON.stringify(savedState.businessContext);

      // Warn only when meaningful user-entered content differs from the last saved snapshot.
      const hasContentToLose =
        currentFormState.businessProblem ||
        currentFormState.businessSolution ||
        Object.keys(currentFormState.evaluationParameters).length > 0 ||
        Object.keys(currentFormState.businessContext).length > 0;

      // Login redirects can remount at defaults before session data catches up.
      if (isAtDefaults) {
        return;
      }

      if (hasUnsavedChanges && hasContentToLose) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePageHide = () => {
      // Page lifecycle events may not wait for the debounce timer.
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

  // Valid forms are likely to submit soon, so warm the result route bundle.
  useEffect(() => {
    if (isValid) {
      import('@/pages/ResultsPage/ResultsPage').catch((error) => {
        logger.warn('[LANDING_PAGE:RESULTS_PAGE_PREFETCH_FAILED]', error);
      });
    }
  }, [isValid]);

  useEffect(() => {
    if (location.state?.formData && !reevaluateDataAppliedRef.current) {
      const { businessProblem, businessSolution, evaluation_parameters, businessContext } =
        location.state.formData;

      // Mark this before reset so session rehydration cannot overwrite the re-evaluate payload.
      reevaluateDataAppliedRef.current = true;

      const newFormData = {
        businessProblem: businessProblem || '',
        businessSolution: businessSolution || '',
        evaluationParameters: evaluation_parameters || {},
        businessContext: businessContext || {},
      };

      reset(newFormData);
      window.history.replaceState({}, document.title);

      // Let react-hook-form apply reset before persisting the imported values.
      setTimeout(() => {
        persistInputs(newFormData);
      }, 100);

      // Re-evaluation returns users directly to the editable form.
      setTimeout(() => {
        const formElement = document.getElementById('ce-assessment-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      toast.success('Form filled with assessment data', { timeout: 3000 });
    }
  }, [location.state?.formData, persistInputs, reset]);

  const handleFormSubmit = async (formData) => {
    // Minimums exclude spaces to match the validation schema and counter.
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
      onError: (error) => {
        setLoading(false);
        resetProgress();

        if (error?.code === 'ANON_SCORING_LIMIT_REACHED') {
          openLimitReachedDialog({
            lastUsedAt: error?.lastUsedAt,
            anonScoringLimit: error?.anonScoringLimit,
            anonScoringUsageRetentionDays: error?.anonScoringUsageRetentionDays,
          });
          return;
        }

        const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
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
                    <Tooltip.Trigger className="w-full" tabIndex={0}>
                      <ButtonStages
                        isLoading={loading}
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
