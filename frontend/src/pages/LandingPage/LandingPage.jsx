import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@heroui/react';
import ParameterInputContainer from '@/pages/LandingPage/components/ParameterInputContainer';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';
import LiveCharacterCounter from '@/pages/LandingPage/components/LiveCharacterCounter';
// Session restore is handled globally via AppSessionManager + SessionRestoreDialog
import { useSession } from '@/features/session/hooks/useSession';
import { useGlobalModal } from '@/contexts/ModalContext';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { getCharacterCount } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { Card, Tooltip, Label, TextArea as Textarea, ScrollShadow } from '@heroui/react';
import { Button } from '@/components/common';
import LoaderIcon from '@/components/common/LoaderIcon';
import { cn } from '@/utils/cn';
import { Accordion } from '@heroui/react';
import {
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Leaf,
  ClipboardPenLine,
  BookOpen,
  ClipboardList,
  FileBox,
} from 'lucide-react';
import InfoIconButton from '@/components/common/InfoIconButton';

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
    openBusinessProblemInfoModal,
    openBusinessSolutionInfoModal,
    openEvaluationParametersHeadingInfoModal,
    openAssessmentMethodologyModal,
    openEvaluationCriteriaModal,
  } = useGlobalModal();

  const [showEvaluationParameters, setShowEvaluationParameters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // session prompt handled globally in AppSessionManager
  const skipAutosaveRef = useRef(false);
  const businessProblemSectionRef = useRef(null);

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

  // Use refs + onChange handlers to debounce autosave without subscribing the whole
  // component to form changes (avoids re-renders on each keystroke).
  const autosaveTimerRef = useRef(null);

  // Session restoration is handled globally; landing page listens for navigation-state restore

  // Pre-fill form with data from ResultsPage (reevaluate)
  useEffect(() => {
    if (location.state?.formData) {
      const { businessProblem, businessSolution, parameters } = location.state.formData;
      reset({
        businessProblem: businessProblem || '',
        businessSolution: businessSolution || '',
        parameters: parameters || {},
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

  // Handle input restoration from SessionRestoreDialog navigation
  useEffect(() => {
    const state = location.state;
    if (state?.restoreInputs && state?.sessionData) {
      const { sessionData } = state;

      if (sessionData.inputs) {
        const { businessProblem, businessSolution, parameters } = sessionData.inputs;
        reset({
          businessProblem: businessProblem || '',
          businessSolution: businessSolution || '',
          parameters: parameters || {},
        });
        setShowEvaluationParameters(true);

        toast.success('Session restored', {
          description: 'Your previous inputs have been restored.',
        });
      }

      // Clear the navigation state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, reset, navigate, location.pathname, toast]);

  useEffect(() => {
    // Session restore prompt display is handled globally via AppSessionManager
  }, [hasEvaluationState, hasRestorableSession]);

  const { user } = useAuth();

  // Debounced autosave using getValues inside delayed callback.
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      // If skip flag is set, consume it and skip this save
      if (skipAutosaveRef.current) {
        skipAutosaveRef.current = false;
        return;
      }

      const values = methods.getValues();
      // Save if any meaningful content exists
      if (values && (values.businessProblem?.trim() || values.businessSolution?.trim())) {
        if (user) {
          saveEvaluation(values);
        } else {
          saveSession({ inputs: values });
        }
      }
    }, 1000);
  }, [user, methods, saveEvaluation, saveSession]);

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
    const uniqueWordRatio = (text) => {
      const words = (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
      if (words.length === 0) return 0;
      const uniq = new Set(words);
      return uniq.size / words.length;
    };

    const nonLetterDensity = (text) => {
      const total = (text || '').length || 1;
      const non = (text.match(/[^a-z0-9\s\.\,\-\_]/gi) || []).length;
      return non / total;
    };

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

      // Clear the draft form data from session
      clearEvaluation();

      // Save the final result to session for refresh persistence
      saveEvaluation({ result, formData });

      toast.success('Assessment complete!', {
        description: 'Your circularity evaluation has been generated successfully.',
        timeout: 3000,
      });

      // Navigate to results page with the result data
      navigate('/results', { state: { result, formData } });
    } catch (err) {
      // Handle anonymous limit reached
      if (err?.code === 'LIMIT_REACHED' || err?.meta?.error === 'LIMIT_REACHED') {
        const meta = err.meta || {};
        openLimitReachedDialog({ limit: meta.limit || 3, message: meta.message });
        // Clear anonymous session after hitting limit
        try {
          clearSession();
        } catch (e) {
          // ignore
        }
        return;
      }

      const errorMessage = err.message || 'Failed to evaluate. Please try again.';
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
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Assessment Methodology & Evaluation Criteria Buttons */}
        <motion.div
          className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div>
            <Button onClick={openAssessmentMethodologyModal} size="lg" variant="success">
              <BookOpen className="w-5 h-5" strokeWidth={2} />
              <span>Assessment Methodology</span>
            </Button>
          </motion.div>

          <motion.div>
            <Button onClick={openEvaluationCriteriaModal} size="lg" variant="eco-soft">
              <ClipboardList className="w-5 h-5" strokeWidth={2} />
              <span>Evaluation Criteria</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="transition-all border border-blue-100 hover:shadow-lg hover:border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 shadow-lg shadow-blue-200/50">
                <Sparkles className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg text-center">AI-Powered</h3>
              <p className="mt-3 text-sm text-center text-gray-600 leading-relaxed">
                Machine learning analysis grounded in circular economy principles.
              </p>
            </div>
          </Card>

          <Card className="transition-all border border-emerald-100 hover:shadow-lg hover:border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 shadow-lg shadow-emerald-200/50">
                <LayoutGrid className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg text-center">Multi-Dimensional</h3>
              <p className="mt-3 text-sm text-center text-gray-600 leading-relaxed">
                Evaluates across key domains for clarity and depth.
              </p>
            </div>
          </Card>

          <Card className="transition-all border border-amber-100 hover:shadow-lg hover:border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-200/50">
                <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg text-center">Actionable</h3>
              <p className="mt-3 text-sm text-center text-gray-600 leading-relaxed">
                Clear recommendations you can apply immediately to improve outcomes.
              </p>
            </div>
          </Card>
        </div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card ref={businessProblemSectionRef} className="transition-shadow border shadow-md">
            <div className="pb-8 px-2 sm:px-6 pt-6">
              <h2 className="inline-flex items-center gap-3 text-2xl font-bold text-teal-700">
                Evaluate Your Circular Economy Business
                <Leaf className="w-6 h-6" strokeWidth={3} />
              </h2>
              <p className="text-gray-600 mt-2">
                Describe your business idea using the same structure as real circular economy
                projects: what problem you solve, and how your solution addresses it.
              </p>
            </div>
            <div className="space-y-6 px-0 xxs:px-2 sm:px-6 pb-6">
              {/* Problem Input */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="ml-2 space-y-1">
                    <div className="flex items-center justify-start gap-3">
                      <Label htmlFor="business-problem" className="text-base font-bold">
                        Business Problem
                      </Label>
                      <InfoIconButton onClick={openBusinessProblemInfoModal} />
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">
                      What environmental or circular economy challenge does your business address?
                    </p>
                  </div>
                </div>
                <Textarea
                  id="business-problem"
                  rows={4}
                  placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually, depleting marine ecosystems and poisoning food chains. Current alternatives are either cost-prohibitive or require complex infrastructure..."
                  {...register('businessProblem', {
                    onChange: () => scheduleAutosave(),
                  })}
                  disabled={loading}
                  className="w-full border border-gray-300 placeholder:opacity-60 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-gray-600 dark:focus:ring-green-900/40 rounded-lg transition-all duration-200 font-semibold"
                />
                <LiveCharacterCounter fieldName="businessProblem" minLength={200} />
              </div>

              {/* Solution Input */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="ml-2 space-y-1">
                    <div className="flex items-center justify-start gap-3">
                      <Label htmlFor="business-solution" className="text-base font-bold">
                        Business Solution
                      </Label>
                      <InfoIconButton onClick={openBusinessSolutionInfoModal} />
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">
                      How does your business solve this problem? Include materials, processes, and
                      circularity strategy.
                    </p>
                  </div>
                </div>
                <Textarea
                  id="business-solution"
                  rows={5}
                  placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste, combined with a hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we aggregate returns at regional hubs; certified composting facilities process 95% of materials into soil amendments sold back to agriculture..."
                  {...register('businessSolution', {
                    onChange: () => scheduleAutosave(),
                  })}
                  disabled={loading}
                  className="w-full border border-gray-300 placeholder:opacity-60 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-gray-600 dark:focus:ring-green-900/40 rounded-lg transition-all duration-200 font-semibold"
                />
                <LiveCharacterCounter fieldName="businessSolution" minLength={200} />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                    <strong className="text-red-700">Validation Error:</strong>
                  </div>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* EvaluationParameters Parameters Section */}
              <Accordion className="w-full" variant="surface">
                <Accordion.Item>
                  <Accordion.Heading>
                    <Accordion.Trigger className="p-2">
                      <div className="flex items-center justify-start">
                        <FileBox className="w-6 h-6 mr-2 text-emerald-600" />
                        <span className="font-semibold text-lg">Evaluation Parameters</span>
                        <InfoIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            openEvaluationParametersHeadingInfoModal();
                          }}
                          className="ml-3"
                        />
                      </div>
                      <Accordion.Indicator>
                        <ChevronDown />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="w-full p-0">
                      <ParameterInputContainer loading={loading} />
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              {/* Submit Button Section */}
              <div className="w-full">
                <Tooltip delay={0} isDisabled={isValid && !loading}>
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
                    <p className="text-xs font-bold">
                      Please fill out all required fields (min. 200 chars each)
                    </p>
                  </Tooltip.Content>
                </Tooltip>
              </div>

              {/* Test Case Selector */}
              <Accordion className="w-full" variant="surface" defaultExpandedKeys={['test-cases']}>
                <Accordion.Item>
                  <Accordion.Heading>
                    <Accordion.Trigger>
                      <ClipboardPenLine className="w-6 h-6 mr-2 text-emerald-600" />
                      <div className="flex flex-col items-start justify-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <span className="font-semibold text-lg">Sample Test Cases</span>
                          <InfoIconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openEvaluationParametersHeadingInfoModal();
                            }}
                            className="mb-px"
                          />
                        </div>
                        <span className="text-xs text-slate-600 text-wrap text-left italic">
                          Use curated examples to explore how the evaluator scores, auto-fill the
                          form for quick testing.
                        </span>
                      </div>
                      <Accordion.Indicator>
                        <ChevronDown />
                      </Accordion.Indicator>
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="pt-2">
                      <SampleTestCasesContainer />
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </div>
          </Card>
        </motion.div>
      </div>
    </FormProvider>
  );
}
