import { Accordion, toast, Tooltip } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeInfo,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  SlidersHorizontal,
  Target,
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
import EvaluationParametersContainer from '@/pages/LandingPage/components/EvaluationParametersContainer';
import LiveCharacterCounter from '@/pages/LandingPage/components/LiveCharacterCounter';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';

// Sample test cases data
const SAMPLE_TEST_CASES = [
  {
    id: 'packaging-reuse',
    title: 'Packaging Reuse System',
    businessProblem:
      'Single-use packaging creates 8 million tons of ocean waste annually. Current solutions are expensive and lack scalability.',
    businessSolution:
      'A platform connecting businesses with surplus packaging to companies needing materials, using AI matching and circular design principles.',
    evaluationParameters: {
      material_efficiency: 4,
      recyclability: 5,
      renewable_content: 3,
      business_model_innovation: 4,
      stakeholder_engagement: 3,
    },
    businessContext: {
      industry: 'packaging',
      company_size: 'startup',
      geographic_scope: 'global',
    },
  },
  {
    id: 'electronics-remanufacturing',
    title: 'Electronics Remanufacturing',
    businessProblem:
      'Electronic waste is the fastest growing waste stream. Most devices are discarded while still functional.',
    businessSolution:
      'Certified remanufacturing facility that refurbishes electronics to original specifications, with buy-back guarantee programs.',
    evaluationParameters: {
      material_efficiency: 5,
      recyclability: 4,
      renewable_content: 4,
      business_model_innovation: 4,
      stakeholder_engagement: 4,
    },
    businessContext: {
      industry: 'electronics',
      company_size: 'medium',
      geographic_scope: 'regional',
    },
  },
];

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
    if (location.state?.formData) {
      const { businessProblem, businessSolution, evaluation_parameters, businessContext } =
        location.state.formData;
      reset({
        businessProblem: businessProblem || '',
        businessSolution: businessSolution || '',
        evaluationParameters: evaluation_parameters || {},
        businessContext: businessContext || {},
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, reset]);

  const { user } = useAuth();

  const handleFormSubmit = async (formData) => {
    // Validate minimum character requirements
    if (getCharacterCount(formData.businessProblem) < 200) {
      toast.danger('Business Problem is too short', {
        description: 'Please provide at least 200 characters for business problem description.',
        timeout: 4000,
      });
      return;
    }

    if (getCharacterCount(formData.businessSolution) < 200) {
      toast.danger('Business Solution is too short', {
        description: 'Please provide at least 200 characters for business solution description.',
        timeout: 4000,
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
        timeout: 4000,
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

    // Ensure all accordions are open when sample test case is selected
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
        {/* Hero */}
        <section className="pt-20 pb-0">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              {/* Main heading — DO NOT CHANGE THIS TEXT */}
              <h1
                className="heading-display leading-[1.08] mb-6"
                style={{ fontSize: 'clamp(38px, 5.5vw, 60px)' }}
              >
                Where circular economy
                <br />
                meets{' '}
                <em className="italic" style={{ color: 'var(--color-accent-700)' }}>
                  evidence.
                </em>
              </h1>

              {/* Subtitle */}
              <p
                className="text-[17px] leading-relaxed max-w-lg mx-auto mb-10 font-normal"
                style={{ color: 'var(--muted)' }}
              >
                Get an evidence-backed circularity score in seconds, grounded in real-world case
                studies.
              </p>

              {/* CTA + Sign Up */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
                {!user && (
                  <button
                    onClick={() => navigate('/auth')}
                    className="px-8 py-3 text-sm font-semibold rounded-3xl border
                               transition-all duration-200 hover:border-(--accent)
                               hover:text-(--foreground) hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    Sign Up
                  </button>
                )}
              </div>

              <p className="label-overline mb-6 tracking-[0.15em] font-medium">
                AI-POWERED · EVIDENCE-BASED · 40,000+ CASES
              </p>
            </motion.div>
          </div>
        </section>

        {/* Meta strip — Assessment Methodology · features · Evaluation Criteria */}
        <div className="flex items-center justify-center gap-10 flex-wrap py-5 mb-2 border-b-[1.5px] border-border">
          {[
            {
              key: 'assessment',
              label: 'Assessment Methodology',
              icon: BookOpen,
              onClick: openAssessmentMethodologyDrawer,
            },
            {
              key: 'evaluation',
              label: 'Evaluation Criteria',
              icon: Target,
              onClick: openEvaluationCriteriaDrawer,
            },
          ].map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              className="flex items-center gap-1.5 text-[11px] tracking-widest cursor-pointer uppercase bg-accent-50 px-3 py-2 rounded-xl
               transition-colors hover:text-[var(--foreground)] hover:bg-slate-50/50 hover:shadow-sm"
              style={{ color: 'var(--muted)' }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Assessment Form */}
        <section id="assessment-form" className="py-12">
          <div className="max-w-4xl mx-auto px-6" ref={formContainerRef}>
            {/* Section heading */}
            <div className="mb-10">
              <h2
                className="font-display text-[22px] font-semibold mb-2 tracking-tight"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Evaluate Your Circular Economy Business
              </h2>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <span
                      className="text-[15px] font-semibold tracking-[-0.01em]"
                      style={{
                        color: 'var(--color-text-primary)',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      Business Problem
                    </span>
                    <BadgeInfo
                      className="info-icon cursor-pointer transition-colors duration-200 hover:opacity-80"
                      size={18}
                      style={{ color: 'var(--color-accent)' }}
                      onClick={openBusinessProblemInfoDrawer}
                    />
                  </div>
                  <p
                    className="text-[13px] leading-relaxed mt-1 mb-2"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    What environmental or circular economy challenge does your business address?
                  </p>
                  <textarea
                    id="business-problem"
                    rows={5}
                    placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually..."
                    {...register('businessProblem', {
                      onBlur: () => flushAutosave(),
                    })}
                    disabled={loading}
                    className="w-full px-4 py-3.5 text-[15px] rounded-xl border resize-none
           focus:outline-none transition-colors duration-150
           placeholder:opacity-40 leading-[1.75]"
                    style={{
                      backgroundColor: 'oklch(0.99 0.008 80 / 0.5)',
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '0.005em',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-accent)';
                      // No box-shadow, no outline
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border-strong)';
                      flushAutosave();
                    }}
                  />
                  <LiveCharacterCounter fieldName="businessProblem" minLength={200} />
                </div>

                {/* Business Solution */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <span
                      className="text-[15px] font-semibold tracking-[-0.01em]"
                      style={{
                        color: 'var(--color-text-primary)',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      Business Solution
                    </span>
                    <BadgeInfo
                      className="info-icon cursor-pointer transition-colors duration-200 hover:opacity-80"
                      size={18}
                      style={{ color: 'var(--color-accent)' }}
                      onClick={openBusinessSolutionInfoDrawer}
                    />
                  </div>
                  <p
                    className="text-[13px] leading-relaxed mt-1 mb-2"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    How does your business solve this problem? Include materials, processes, and
                    circularity strategy.
                  </p>
                  <textarea
                    id="business-solution"
                    rows={6}
                    placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste..."
                    {...register('businessSolution', {
                      onBlur: () => flushAutosave(),
                    })}
                    disabled={loading}
                    className="w-full px-4 py-3.5 text-[15px] rounded-xl border resize-none
           focus:outline-none transition-colors duration-150
           placeholder:opacity-40 leading-[1.75]"
                    style={{
                      backgroundColor: 'oklch(0.99 0.008 80 / 0.5)',
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '0.005em',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-accent)';
                      // No box-shadow, no outline
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border-strong)';
                      flushAutosave();
                    }}
                  />
                  <LiveCharacterCounter fieldName="businessSolution" minLength={200} />
                </div>

                {/* Business Context */}
                <div
                  className="group/bcacc w-full rounded-xl overflow-hidden shadow-sm transition-shadow duration-300"
                  style={{
                    border: '1px solid var(--color-border-strong)',
                    backgroundColor: 'oklch(0.99 0.008 80 / 0.3)',
                  }}
                >
                  <Accordion
                    className="w-full"
                    variant="default"
                    expandedKeys={businessContextExpandedKeys}
                    onExpandedChange={setBusinessContextExpandedKeys}
                  >
                    <Accordion.Item id="business-context-heading">
                      <Accordion.Heading>
                        <Accordion.Trigger
                          className="flex items-center gap-3 px-5 py-3
                              transition-colors duration-150
                              hover:bg-[var(--color-accent-soft)]"
                        >
                          <BriefcaseBusiness
                            className="h-6 w-6 shrink-0 mr-1
               transition-[scale,rotate] duration-300 ease-out
               group-hover/bcacc:scale-[1.2] group-hover/bcacc:-rotate-10
               group-hover/bcacc:drop-shadow-md"
                            style={{ color: 'var(--color-accent)' }}
                            strokeWidth={1.75}
                          />
                          <div className="flex flex-col gap-0.5 text-left flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-semibold text-[15px] tracking-[-0.01em] leading-6"
                                style={{
                                  color: 'var(--color-text-primary)',
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                Business Context
                              </span>
                              <BadgeInfo
                                className="info-icon cursor-pointer"
                                size={18}
                                style={{ color: 'var(--color-accent)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBusinessContextHeadingInfoDrawer();
                                }}
                              />
                            </div>
                            <span
                              className="text-xs leading-4"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              Optional — improves analysis quality
                            </span>
                          </div>
                          <Accordion.Indicator
                            className="[&>svg]:size-4"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <ChevronDown />
                          </Accordion.Indicator>
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="p-0 bg-transparent">
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          >
                            <BusinessContextContainer loading={loading} />
                          </motion.div>
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </div>

                {/* Evaluation Parameters */}
                <div
                  className="group/epacc w-full rounded-xl overflow-hidden shadow-sm transition-shadow duration-300"
                  style={{
                    border: '1px solid var(--color-border-strong)',
                    backgroundColor: 'oklch(0.99 0.008 80 / 0.3)',
                  }}
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
                        <Accordion.Trigger
                          className="flex items-center gap-3 px-5 py-3
                              transition-colors duration-150
                              hover:bg-[var(--color-accent-soft)]"
                        >
                          <SlidersHorizontal
                            className="h-6 w-6 shrink-0 mr-1
               transition-[scale,rotate] duration-300 ease-out
               group-hover/epacc:scale-[1.2] group-hover/epacc:-rotate-10
               group-hover/epacc:drop-shadow-md"
                            style={{ color: 'var(--color-success)' }}
                            strokeWidth={1.75}
                          />
                          <div className="flex flex-col gap-0.5 text-left flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-semibold text-[15px] tracking-[-0.01em] leading-6"
                                style={{
                                  color: 'var(--color-text-primary)',
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                Evaluation Parameters
                              </span>
                              <BadgeInfo
                                className="info-icon cursor-pointer"
                                size={18}
                                style={{ color: 'var(--color-success)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEvaluationParametersHeadingInfoDrawer();
                                }}
                              />
                            </div>
                            <span
                              className="text-xs leading-4"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              Score each dimension of circular value
                            </span>
                          </div>
                          <Accordion.Indicator
                            className="[&>svg]:size-4"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <ChevronDown />
                          </Accordion.Indicator>
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="p-0 bg-transparent">
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          >
                            <EvaluationParametersContainer
                              loading={loading}
                              innerExpandedKeys={innerExpandedKeys}
                              onInnerExpandedChange={setInnerExpandedKeys}
                            />
                          </motion.div>
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="border border-[rgba(139,58,58,0.25)] bg-[rgba(139,58,58,0.05)] rounded-md p-4 text-(--color-error) mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
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
                        fullWidth
                        className="h-12"
                      >
                        {loading ? (
                          <LoaderIcon isButton={true} color="#ffffff" />
                        ) : (
                          <span>Evaluate Circularity</span>
                        )}
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content showArrow placement="top">
                      <Tooltip.Arrow />
                      <span>
                        Please fill out business problem and solution fields (min. 200 chars each)
                      </span>
                    </Tooltip.Content>
                  </Tooltip>
                </div>

                {/* Sample Test Cases */}
                <div
                  className="group/stcacc w-full rounded-xl overflow-hidden shadow-sm transition-shadow duration-300"
                  style={{
                    border: '1px solid var(--color-border-strong)',
                    backgroundColor: 'oklch(0.99 0.008 80 / 0.3)',
                  }}
                >
                  <Accordion
                    className="w-full"
                    variant="default"
                    expandedKeys={sampleTestCasesExpandedKeys}
                    onExpandedChange={setSampleTestCasesExpandedKeys}
                  >
                    <Accordion.Item id="test-cases" defaultExpanded={true}>
                      <Accordion.Heading>
                        <Accordion.Trigger
                          className="flex items-center gap-3 px-5 py-3
                              transition-colors duration-150
                              hover:bg-[var(--color-accent-soft)]"
                        >
                          <ClipboardList
                            className="h-6 w-6 shrink-0 mr-1
               transition-[scale,rotate] duration-300 ease-out
               group-hover/stcacc:scale-[1.2] group-hover/stcacc:-rotate-10
               group-hover/stcacc:drop-shadow-md"
                            style={{ color: 'var(--color-accent)' }}
                            strokeWidth={1.75}
                          />
                          <div className="flex flex-col gap-0.5 text-left flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-semibold text-[15px] tracking-[-0.01em] leading-6"
                                style={{
                                  color: 'var(--color-text-primary)',
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                Sample Test Cases
                              </span>
                              <BadgeInfo
                                className="info-icon cursor-pointer"
                                size={18}
                                style={{ color: 'var(--color-accent)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSampleTestCasesHeadingInfoDrawer();
                                }}
                              />
                            </div>
                            <span
                              className="text-xs leading-4"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              Auto-fill form with curated examples for quick testing
                            </span>
                          </div>
                          <Accordion.Indicator
                            className="[&>svg]:size-4"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <ChevronDown />
                          </Accordion.Indicator>
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="pt-2 bg-transparent">
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          >
                            <SampleTestCasesContainer
                              openEvalParams={openEvalParams}
                              openBusinessContext={openBusinessContext}
                            />
                          </motion.div>
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
