import { Accordion, toast, Tooltip } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeInfo,
  ChevronDown,
  ClipboardList,
  MonitorCog,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

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
import HeroSection from '@/pages/LandingPage/components/HeroSection';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [innerExpandedKeys, setInnerExpandedKeys] = useState(
    new Set(['Access Value', 'Embedded Value', 'Processing Value']),
  );

  // State and refs for full session autosave logic
  const skipAutosaveRef = useRef(false);
  const businessProblemSectionRef = useRef(null);
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

  const methods = useForm({
    resolver: zodResolver(assessmentSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { isValid },
  } = methods;

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
    setInnerExpandedKeys(new Set(['Access Value', 'Embedded Value', 'Processing Value']));
  };

  const openBusinessContext = () => {
    setBusinessContextExpandedKeys(new Set(['business-context-heading']));
  };

  const ALL_INNER_KEYS = new Set(['Access Value', 'Embedded Value', 'Processing Value']);

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
  }, [sessionData, location.state, reset, methods]);

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

      // Compare current form state with saved state
      const hasUnsavedChanges =
        currentFormState.businessProblem !== savedState.businessProblem ||
        currentFormState.businessSolution !== savedState.businessSolution ||
        JSON.stringify(currentFormState.evaluationParameters) !==
          JSON.stringify(savedState.evaluationParameters) ||
        JSON.stringify(currentFormState.businessContext) !==
          JSON.stringify(savedState.businessContext);

      // Only show alert if there are unsaved changes AND there's actually content to lose
      const hasContentToLose =
        currentFormState.businessProblem ||
        currentFormState.businessSolution ||
        Object.keys(currentFormState.evaluationParameters).length > 0 ||
        Object.keys(currentFormState.businessContext).length > 0;

      // Debug logging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('BeforeUnload Debug:', {
          currentFormState,
          savedState,
          hasUnsavedChanges,
          hasContentToLose,
        });
      }

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
        console.warn('Failed to prefetch ResultsPage:', err);
      });
    }
  }, [isValid]);

  // Pre-fill form with data from ResultsPage (reevaluate)
  useEffect(() => {
    if (location.state?.formData && !reevaluateDataAppliedRef.current) {
      const { businessProblem, businessSolution, evaluation_parameters, businessContext } =
        location.state.formData;

      // Mark that re-evaluate data is being applied
      reevaluateDataAppliedRef.current = true;

      const newFormData = {
        businessProblem: businessProblem || '',
        businessSolution: businessSolution || '',
        evaluationParameters: evaluation_parameters || {},
        businessContext: businessContext || {},
      };

      reset(newFormData);
      window.history.replaceState({}, document.title);

      // Immediately save the re-evaluate data to prevent false unsaved changes alert
      persistInputs(newFormData);

      // Show toast notification
      toast.success('Form filled with assessment data', { timeout: 3000 });
    }
  }, [location.state?.formData, persistInputs]);

  const { user } = useAuth();

  const handleFormSubmit = async (formData) => {
    // Validate minimum character requirements
    if (getCharacterCount(formData.businessProblem) < 200) {
      toast.danger('Business Problem is too short', {
        description: 'Please provide at least 200 characters for business problem description.',
        timeout: 3000,
      });
      return;
    }

    if (getCharacterCount(formData.businessSolution) < 200) {
      toast.danger('Business Solution is too short', {
        description: 'Please provide at least 200 characters for business solution description.',
        timeout: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await scoreAssessment(formData);

      // Persist inputs and save the full result snapshot
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
          clearSession();
        } catch (e) {
          console.error('Failed to clear session after limit reached:', e);
        }
        return;
      }

      const errorMessage = err?.message || err?.error || 'An unexpected error occurred';
      setError(errorMessage);
      toast.danger('Evaluation failed', {
        description: errorMessage,
        timeout: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSampleTestSelect = (testCase) => {
    reset({
      businessProblem: testCase.businessProblem,
      businessSolution: testCase.businessSolution,
      evaluationParameters: testCase.evaluationParameters,
      businessContext: testCase.businessContext,
    });

    // Open all 5 accordions above Sample Test Cases when a test case is selected:
    // 1. Business Context accordion
    // 2. Evaluation Parameters accordion
    // 3. Access Value accordion
    // 4. Embedded Value accordion
    // 5. Processing Value accordion
    setEvalParamsExpandedKeys(
      new Set([
        'evaluation-parameters-heading',
        'Access Value',
        'Embedded Value',
        'Processing Value',
      ]),
    );
    setInnerExpandedKeys(new Set(['Access Value', 'Embedded Value', 'Processing Value']));
    setBusinessContextExpandedKeys(new Set(['business-context-heading']));

    toast.success('Sample test case loaded', {
      description: 'Form has been filled with the example data.',
      timeout: 2000,
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
              <div className="space-y-8">
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
                                className="info-icon mt-px shrink-0 cursor-pointer text-(--color-accent)"
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
                                className="info-icon mt-px shrink-0 cursor-pointer text-(--color-success)"
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
                            innerExpandedKeys={innerExpandedKeys}
                            onInnerExpandedChange={setInnerExpandedKeys}
                          />
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 rounded-md border border-[rgba(139,58,58,0.25)] bg-[rgba(139,58,58,0.05)] p-4 text-(--color-error)">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="size-4" />
                      <strong className="font-semibold">Validation Error:</strong>
                    </div>
                    <p>{error}, please try again.</p>
                  </div>
                )}

                {/* Submit button */}
                <div className="w-full">
                  <Tooltip delay={0} isDisabled={isValid}>
                    <Tooltip.Trigger>
                      <Button
                        size="lg"
                        onPress={handleSubmit(handleFormSubmit)}
                        isDisabled={loading || !isValid}
                        variant="teal"
                        className="h-12 rounded-4xl"
                        fullWidth
                      >
                        {loading ? (
                          <LoaderIcon isButton={true} color="#ffffff" />
                        ) : (
                          <span>Evaluate Circularity</span>
                        )}
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content showArrow placement="top">
                      <span>
                        Please fill out business problem and solution fields (min. 200 chars each)
                      </span>
                    </Tooltip.Content>
                  </Tooltip>
                </div>

                {/* Sample Test Cases */}
                <div className="group/stcacc w-full overflow-hidden rounded-xl border border-(--color-border-strong) bg-[oklch(0.99_0.008_80/0.3)] shadow-sm transition-shadow duration-300">
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
                                className="info-icon mt-px shrink-0 cursor-pointer text-(--color-accent)"
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
                        <Accordion.Body className="bg-transparent pt-2">
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
