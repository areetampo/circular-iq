import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ParameterInputContainer from '@/pages/LandingPage/components/ParameterInputContainer';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';
import SessionRestorePrompt from '@/features/session/components/SessionRestorePrompt';
import { useSession } from '@/features/session/hooks/useSession';
import { getCharacterCount } from '@/lib/validation';
import { motion, AnimatePresence } from 'framer-motion';
import AppContainer from '@/components/layout/AppContainer';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Info,
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { hasEvaluationState, restoreEvaluation, clearEvaluation, saveEvaluation } = useSession();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSessionPrompt, setShowSessionPrompt] = useState(hasEvaluationState);

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

  const businessProblem = watch('businessProblem') || '';
  const businessSolution = watch('businessSolution') || '';
  const allFormValues = watch();

  const handleRestore = () => {
    const restoredState = restoreEvaluation();
    if (restoredState) {
      reset(restoredState);
      setShowSessionPrompt(false);
    }
  };

  // Auto-save form state to session on every change
  useEffect(() => {
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
      {showSessionPrompt && (
        <SessionRestorePrompt
          onRestore={handleRestore}
          onDismiss={() => {
            setShowSessionPrompt(false);
            clearEvaluation();
          }}
        />
      )}
      <AppContainer
        // className="landing-page-container"
        headerProps={{
          title: 'Circularity AI Evaluator',
          subtitle:
            'Assess and enhance your circular economy business ideas with AI-driven insights.',
          showAssessmentMethodologyButton: true,
          showEvaluationCriteriaButton: true,
          showMyAssessmentsButton: true,
        }}
      >
        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-orange-100">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">AI-Powered</CardTitle>
              <CardDescription>
                Machine learning analysis based on circular economy principles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-blue-100">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Multi-Dimensional</CardTitle>
              <CardDescription>Evaluates across 5 key circular economy domains</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Actionable</CardTitle>
              <CardDescription>Receive specific recommendations for improvement</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Evaluate Your Circular Economy Business</CardTitle>
            <CardDescription>
              Describe your business idea using the same structure as real circular economy
              projects: what problem you solve, and how your solution addresses it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Problem Input */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Label htmlFor="business-problem" className="text-base font-semibold">
                    Business Problem
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    What environmental or circular economy challenge does your business address?
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 -mt-1"
                  onClick={() =>
                    toast.info('Business Problem Tips', {
                      description:
                        'Describe the specific environmental or waste problem your business addresses. Include scale, impact, and current gaps in existing solutions.',
                    })
                  }
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                id="business-problem"
                rows={4}
                placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually, depleting marine ecosystems and poisoning food chains. Current alternatives are either cost-prohibitive or require complex infrastructure..."
                {...register('businessProblem')}
                disabled={loading}
                className="resize-none"
              />
              <div className="flex justify-end">
                <span
                  className={cn(
                    'text-sm font-medium',
                    getCharacterCount(businessProblem) >= 200 ? 'text-primary' : 'text-destructive',
                  )}
                >
                  {getCharacterCount(businessProblem)} / 200 characters
                </span>
              </div>
            </div>

            <Separator />

            {/* Solution Input */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Label htmlFor="business-solution" className="text-base font-semibold">
                    Business Solution
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    How does your business solve this problem? Include materials, processes, and
                    circularity strategy.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 -mt-1"
                  onClick={() =>
                    toast.info('Business Solution Tips', {
                      description:
                        'Explain your circular solution, including materials used, collection/processing methods, and how it closes the loop. Be specific about your approach.',
                    })
                  }
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                id="business-solution"
                rows={4}
                placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste, combined with a hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we aggregate returns at regional hubs; certified composting facilities process 95% of materials into soil amendments sold back to agriculture..."
                {...register('businessSolution')}
                disabled={loading}
                className="resize-none"
              />
              <div className="flex justify-end">
                <span
                  className={cn(
                    'text-sm font-medium',
                    getCharacterCount(businessSolution) >= 200
                      ? 'text-primary'
                      : 'text-destructive',
                  )}
                >
                  {getCharacterCount(businessSolution)} / 200 characters
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>⚠ Validation Error:</strong>
                  <p className="mt-1">{error}</p>
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Advanced Parameters Section */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                className="justify-start w-full gap-2 text-base font-semibold h-auto px-0 hover:bg-transparent text-primary"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                Advanced Parameters
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info('Evaluation Factors', {
                      description:
                        'Fine-tune the assessment by adjusting individual circular economy factors like accessibility, embedded value, processing, product longevity, and categories.',
                    });
                  }}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </Button>

              <AnimatePresence initial={false}>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <ParameterInputContainer loading={loading} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Submit Button */}
            <Button
              size="lg"
              className="w-full gap-2 text-lg h-14"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={loading || !isValid}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  Evaluate Circularity
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>

            {/* Test Case Selector */}
            <SampleTestCasesContainer />
          </CardContent>
        </Card>
      </AppContainer>
    </FormProvider>
  );
}
