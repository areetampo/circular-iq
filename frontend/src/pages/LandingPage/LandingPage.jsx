import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import ParameterInputContainer from '@/pages/LandingPage/components/ParameterInputContainer';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';
import LiveCharacterCounter from '@/pages/LandingPage/components/LiveCharacterCounter';
import SessionRestorePrompt from '@/features/session/components/SessionRestorePrompt';
import { useSession } from '@/features/session/hooks/useSession';
import useLandingModals from '@/pages/LandingPage/hooks/useLandingModals';
import LandingModalManager from '@/components/modals/landing/LandingModalManager';
import { getCharacterCount } from '@/lib/validation';
import { motion, AnimatePresence } from 'framer-motion';
import AppContainer from '@/components/layout/AppContainer';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoaderIcon from '@/components/common/LoaderIcon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip } from '@heroui/react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import InfoIconButton from '@/components/common/InfoIconButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { hasEvaluationState, restoreEvaluation, clearEvaluation, saveEvaluation } = useSession();
  const {
    modal,
    isModalOpen,
    onClose,
    openBusinessProblem,
    openBusinessSolution,
    openEvaluationParameters,
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
      toast.error('Business Problem is too short', {
        description: 'Please provide at least 200 characters for the business problem description.',
      });
      return;
    }

    if (getCharacterCount(formData.businessSolution) < 200) {
      toast.error('Business Solution is too short', {
        description:
          'Please provide at least 200 characters for the business solution description.',
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
      });

      // Navigate to results page with the result data
      navigate('/results', { state: { result, formData } });
    } catch (err) {
      const errorMessage = err.message || 'Failed to evaluate. Please try again.';
      setError(errorMessage);
      toast.error('Evaluation failed', {
        description: errorMessage,
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
        <AppContainer
          // className="landing-page-container"
          headerProps={{
            title: 'Circularity Economy Business Evaluator',
            subtitle:
              'Assess and enhance your circular economy business ideas with AI-driven insights.',
            showAssessmentMethodologyButton: true,
            showEvaluationCriteriaButton: true,
            showMyAssessmentsButton: true,
          }}
        >
          <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Hero */}
            {/* <section className="text-center">
              <h1 className="inline-flex items-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Professional-grade circular economy assessment
              </h1>
              <p className="max-w-2xl mx-auto mt-4 text-base leading-relaxed text-muted-foreground">
                Turn your sustainability idea into a structured, data-driven evaluation with clear
                recommendations and benchmarking.
              </p>
            </section> */}

            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="transition-shadow border bg-card hover:shadow-md">
                <CardContent className="flex flex-col items-center justify-center pt-6">
                  <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-lg bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">AI-Powered</h3>
                  <p className="mt-2 text-sm text-center text-muted-foreground">
                    Machine learning analysis grounded in circular economy principles.
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-shadow border bg-card hover:shadow-md">
                <CardContent className="flex flex-col items-center justify-center pt-6">
                  <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-lg bg-primary/10">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Multi-Dimensional</h3>
                  <p className="mt-2 text-sm text-center text-muted-foreground">
                    Evaluates across key domains for clarity and depth.
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-shadow border bg-card hover:shadow-md">
                <CardContent className="flex flex-col items-center justify-center pt-6">
                  <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-lg bg-primary/10">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Actionable</h3>
                  <p className="mt-2 text-sm text-center text-muted-foreground">
                    Clear recommendations you can apply immediately to improve outcomes.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Card className="transition-shadow border shadow-md bg-card">
                <CardHeader className="pb-8">
                  <CardTitle className="inline-flex items-center gap-3 text-2xl font-bold text-teal-700">
                    Evaluate Your Circular Economy Business
                    <Leaf className="w-6 h-6" strokeWidth={3} />
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Describe your business idea using the same structure as real circular economy
                    projects: what problem you solve, and how your solution addresses it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Problem Input */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="ml-2 space-y-1">
                        <div className="flex items-center justify-start gap-3">
                          <Label htmlFor="business-problem" className="text-base font-bold">
                            Business Problem
                          </Label>
                          <InfoIconButton onClick={openBusinessProblem} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          What environmental or circular economy challenge does your business
                          address?
                        </p>
                      </div>
                    </div>
                    <Textarea
                      id="business-problem"
                      rows={4}
                      placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually, depleting marine ecosystems and poisoning food chains. Current alternatives are either cost-prohibitive or require complex infrastructure..."
                      {...register('businessProblem')}
                      disabled={loading}
                      className="border-2 focus:border-emerald-600"
                    />
                    <LiveCharacterCounter fieldName="businessProblem" minLength={200} />
                  </div>

                  <Separator />

                  {/* Solution Input */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="ml-2 space-y-1">
                        <div className="flex items-center justify-start gap-3">
                          <Label htmlFor="business-solution" className="text-base font-bold">
                            Business Solution
                          </Label>
                          <InfoIconButton onClick={openBusinessSolution} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          How does your business solve this problem? Include materials, processes,
                          and circularity strategy.
                        </p>
                      </div>
                    </div>
                    <Textarea
                      id="business-solution"
                      rows={5}
                      placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste, combined with a hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we aggregate returns at regional hubs; certified composting facilities process 95% of materials into soil amendments sold back to agriculture..."
                      {...register('businessSolution')}
                      disabled={loading}
                      className="border-2 focus:border-emerald-600"
                    />
                    <LiveCharacterCounter fieldName="businessSolution" minLength={200} />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                          <strong>Validation Error:</strong>
                        </div>
                        <p className="mt-1">{error}</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  {/* EvaluationParameters Parameters Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-start text-emerald-600">
                      <Button
                        type="button"
                        variant="ghost"
                        className="p-0 mr-1 text-base font-semibold"
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
                          openEvaluationParameters();
                        }}
                        className="ml-2 mt-[1px]"
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

                  {/* Submit Button */}
                  <div className="w-full">
                    {!isValid && !loading ? (
                      <Tooltip
                        placement="top"
                        content={
                          <div className="px-3 py-1.5 text-xs text-white rounded-full shadow-md bg-slate-900">
                            Please fill out all required fields (min. 200 chars each)
                          </div>
                        }
                      >
                        <div className="w-full">
                          <Button
                            size="lg"
                            onClick={handleSubmit(handleFormSubmit)}
                            disabled={loading || !isValid}
                            className={cn(
                              'w-full gap-2 text-xl font-bold h-14 transition-all duration-200 border-none shadow-sm mb-2',
                              'enabled:bg-gradient-to-r enabled:from-emerald-600 enabled:via-green-600 enabled:to-teal-600 enabled:text-white',
                              'enabled:hover:from-emerald-700 enabled:hover:to-teal-700 enabled:hover:shadow-md',
                              'enabled:active:scale-[0.98]',
                              'disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60',
                            )}
                          >
                            {loading ? (
                              <div className="flex items-center justify-center gap-4">
                                <LoaderIcon isButton={true} color="" />
                                <span>Evaluating...</span>
                              </div>
                            ) : (
                              <span>Evaluate Circularity</span>
                            )}
                          </Button>
                        </div>
                      </Tooltip>
                    ) : (
                      <div className="w-full">
                        <Button
                          size="lg"
                          onClick={handleSubmit(handleFormSubmit)}
                          disabled={loading || !isValid}
                          className={cn(
                            'w-full gap-2 text-xl font-bold h-14 transition-all duration-200 border-none shadow-sm',
                            'enabled:bg-gradient-to-r enabled:from-emerald-600 enabled:via-green-600 enabled:to-teal-600 enabled:text-white',
                            'enabled:hover:from-emerald-700 enabled:hover:to-teal-700 enabled:hover:shadow-md',
                            'enabled:active:scale-[0.98]',
                            'disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60',
                          )}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-4">
                              <LoaderIcon isButton={true} color="" />
                              <span>Evaluating...</span>
                            </div>
                          ) : (
                            <>Evaluate Circularity</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Test Case Selector */}
                  <SampleTestCasesContainer
                    setShowEvaluationParameters={setShowEvaluationParameters}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </AppContainer>
      )}

      {/* Landing Page Modals */}
      <LandingModalManager modal={modal} isModalOpen={isModalOpen} onClose={onClose} />
    </FormProvider>
  );
}
