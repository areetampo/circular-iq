import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@heroui/react';
import ParameterInputContainer from '@/pages/LandingPage/components/ParameterInputContainer';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';
import LiveCharacterCounter from '@/pages/LandingPage/components/LiveCharacterCounter';
import SessionRestorePrompt from '@/features/session/components/SessionRestorePrompt';
import { useSession } from '@/features/session/hooks/useSession';
import useLandingModals from '@/pages/LandingPage/hooks/useLandingModals';
import LandingModalManager from '@/components/modals/landing/LandingModalManager';
import { getCharacterCount } from '@/lib/validation';
import { motion, AnimatePresence } from 'framer-motion';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { Card, Button, Tooltip, Label, TextArea as Textarea } from '@heroui/react';
import LoaderIcon from '@/components/common/LoaderIcon';
import { cn } from '@/utils/cn';

import {
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Leaf,
  ClipboardPenLine,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import InfoIconButton from '@/components/common/InfoIconButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { hasEvaluationState, restoreEvaluation, clearEvaluation, saveEvaluation } = useSession();
  const {
    modal,
    isModalOpen,
    onClose,
    openBusinessProblemInfoModal,
    openBusinessSolutionInfoModal,
    openEvaluationParametersInfoModal,
    openAssessmentMethodologyModal,
    openEvaluationCriteriaModal,
  } = useLandingModals();
  const [showEvaluationParameters, setShowEvaluationParameters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSessionPrompt, setShowSessionPrompt] = useState(() => {
    // Initialize from sessionStorage to ensure prompt only shows once per browser session
    const handled = sessionStorage.getItem('sessionPromptHandled');
    return !handled && hasEvaluationState;
  });
  const [sessionPromptHandled, setSessionPromptHandled] = useState(() => {
    return sessionStorage.getItem('sessionPromptHandled') === 'true';
  });
  const skipAutosaveRef = useRef(false);

  const methods = useForm({
    resolver: zodResolver(assessmentSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { isValid },
  } = methods;

  const allFormValues = watch();

  const handleRestore = () => {
    const restoredState = restoreEvaluation();
    if (restoredState) {
      reset(restoredState);
      setShowSessionPrompt(false);
      setSessionPromptHandled(true);
      sessionStorage.setItem('sessionPromptHandled', 'true');
    }
  };

  useEffect(() => {
    // Only show prompt once per browser session, on first page load with saved state
    if (
      !sessionPromptHandled &&
      hasEvaluationState &&
      !sessionStorage.getItem('sessionPromptHandled')
    ) {
      setShowSessionPrompt(true);
    }
  }, []);

  // Auto-save form state to session on every change
  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return undefined;
    }

    const debounceTimer = setTimeout(() => {
      if (allFormValues && allFormValues.businessProblem && allFormValues.businessSolution) {
        saveEvaluation(allFormValues);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [allFormValues, saveEvaluation]);

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
      <SessionRestorePrompt
        isOpen={showSessionPrompt}
        onRestore={handleRestore}
        onDismiss={() => {
          setShowSessionPrompt(false);
          setSessionPromptHandled(true);
          sessionStorage.setItem('sessionPromptHandled', 'true');
          skipAutosaveRef.current = true;
          reset(defaultValues);
          clearEvaluation();
        }}
      />
      {!showSessionPrompt && (
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Hero */}
          {/* <section className="text-center">
              <h1 className="inline-flex items-center text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Professional-grade circular economy assessment
              </h1>
              <p className="max-w-2xl mx-auto mt-4 text-base leading-relaxed text-gray-600">
                Turn your sustainability idea into a structured, data-driven evaluation with clear
                recommendations and benchmarking.
              </p>
            </section> */}

          {/* Assessment Methodology & Evaluation Criteria Buttons */}
          <motion.div
            className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div>
              <Button
                onClick={openAssessmentMethodologyModal}
                size="lg"
                className="
                  gap-3 font-semibold text-white text-base px-8 h-13
                  transition-all duration-200 ease-out
                  rounded-full shadow-sm
                  bg-gradient-to-r from-green-400 to-emerald-500
                  hover:from-green-500 hover:to-emerald-600
                  hover:shadow-md
                "
              >
                <BookOpen className="w-5 h-5" strokeWidth={2} />
                <span>Assessment Methodology</span>
              </Button>
            </motion.div>

            <motion.div>
              <Button
                onClick={openEvaluationCriteriaModal}
                size="lg"
                variant="bordered"
                className="
                  gap-3 font-semibold text-base px-8 h-13
                  transition-all duration-200 ease-out
                  rounded-full shadow-sm
                  border-2 border-green-300 text-green-700
                  dark:text-green-400 dark:border-green-600
                  bg-green-50/50 dark:bg-green-950/20
                  hover:bg-green-100/50 dark:hover:bg-green-900/30
                  hover:border-green-400 dark:hover:border-green-500
                  hover:shadow-md
                "
              >
                <ClipboardList className="w-5 h-5" strokeWidth={2} />
                <span>Evaluation Criteria</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="transition-all border border-blue-100 hover:shadow-lg hover:border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <div className="flex flex-col items-center justify-center pt-8 px-6 py-8">
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
              <div className="flex flex-col items-center justify-center pt-8 px-6 py-8">
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
              <div className="flex flex-col items-center justify-center pt-8 px-6 py-8">
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
            <Card className="transition-shadow border shadow-md">
              <div className="pb-8 px-6 pt-6">
                <h2 className="inline-flex items-center gap-3 text-2xl font-bold text-teal-700">
                  Evaluate Your Circular Economy Business
                  <Leaf className="w-6 h-6" strokeWidth={3} />
                </h2>
                <p className="text-gray-600 mt-2">
                  Describe your business idea using the same structure as real circular economy
                  projects: what problem you solve, and how your solution addresses it.
                </p>
              </div>
              <div className="space-y-6 px-6 pb-6">
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
                    {...register('businessProblem')}
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
                    {...register('businessSolution')}
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
                <div className="space-y-4">
                  <div className="flex items-center justify-start text-emerald-600">
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-0 mr-1 text-base font-semibold hover:bg-transparent hover:cursor-pointer"
                      onClick={() => setShowEvaluationParameters(!showEvaluationParameters)}
                    >
                      <ChevronRight
                        className={cn(
                          'w-5 h-5 transition-transform duration-500',
                          showEvaluationParameters && 'rotate-90',
                        )}
                      />
                      <span className="font-bold">Evaluation Parameters</span>
                    </Button>

                    <InfoIconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        openEvaluationParametersInfoModal();
                      }}
                      className="mt-px ml-2"
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {showEvaluationParameters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0.5 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0.5 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <ParameterInputContainer loading={loading} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button Section */}
                <div className="w-full">
                  <Tooltip delay={0} isDisabled={isValid && !loading}>
                    <Tooltip.Trigger asChild>
                      <div className="w-full">
                        <Button
                          size="lg"
                          onPress={handleSubmit(handleFormSubmit)}
                          isDisabled={loading || !isValid}
                          className="
            /* Always Visible Structure */
            w-full h-14 mb-2 gap-3 px-8
            text-xl font-bold text-white
            transition-all duration-300 ease-out
            rounded-xl shadow-lg
            ring-1 ring-white/20 inset-ring-1 inset-ring-black/5

            /* Emerald Gradient (Active State) */
            bg-linear-to-br from-emerald-500 via-green-600 to-teal-600
            hover:from-emerald-600 hover:to-teal-700
            hover:shadow-emerald-200/50 hover:scale-[0.9925]
            active:scale-[1] active:translate-y-0

            /* Grey State (Disabled State) */
            data-[disabled=true]:bg-none
            data-[disabled=true]:bg-slate-200
            data-[disabled=true]:text-slate-500
            data-[disabled=true]:shadow-none
            data-[disabled=true]:cursor-not-allowed
            data-[disabled=true]:opacity-70
            data-[disabled=true]:hover:translate-y-0
            data-[disabled=true]:hover:scale-100
          "
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-3">
                              <LoaderIcon isButton={true} className="animate-spin" />
                              <span className="tracking-wide">Evaluating...</span>
                            </div>
                          ) : (
                            <span>Evaluate Circularity</span>
                          )}
                        </Button>
                      </div>
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
                <SampleTestCasesContainer
                  setShowEvaluationParameters={setShowEvaluationParameters}
                />
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Landing Page Modals */}
      <LandingModalManager modal={modal} isModalOpen={isModalOpen} onClose={onClose} />
    </FormProvider>
  );
}
