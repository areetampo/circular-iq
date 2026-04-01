import { toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, ChevronDown, Target } from 'lucide-react';
import { debounce, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { useSession } from '@/features/session/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
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
  const { openAssessmentMethodologyDrawer, openEvaluationCriteriaDrawer } = useGlobalDrawer();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBusinessContext, setShowBusinessContext] = useState(false);
  const [showEvaluationParameters, setShowEvaluationParameters] = useState(false);
  const [innerExpandedKeys, setInnerExpandedKeys] = useState({});
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

  // Debounced autosave for form data
  const debouncedSave = useRef(
    debounce((formData) => {
      if (isValid) {
        saveSession({
          inputs: {
            businessProblem: formData.businessProblem,
            businessSolution: formData.businessSolution,
            evaluationParameters: formData.evaluationParameters || {},
            businessContext: formData.businessContext || {},
          },
        });
      }
    }, 1000),
  ).current;

  // Watch form changes and trigger autosave
  useEffect(() => {
    const subscription = watch((formData) => {
      debouncedSave(formData);
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave]);

  // Callbacks for SampleTestCasesContainer
  const openEvalParams = () => {
    setShowEvaluationParameters(true);
    setShowBusinessContext(false);
  };

  const openBusinessContext = () => {
    setShowBusinessContext(true);
    setShowEvaluationParameters(false);
  };

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
        evaluation_parameters: evaluation_parameters || {},
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

    toast.success('Sample test case loaded', {
      description: 'Form has been filled with the example data.',
      timeout: 2000,
    });
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-transparent">
        {/* Hero Section */}
        <section className="pt-16 pb-10">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Eyebrow */}
              <p className="text-xs tracking-widest text-(--color-text-muted) uppercase font-(--font-body) mb-4">
                AI-POWERED · EVIDENCE-BASED · 40,000+ CASES
              </p>

              {/* Main Headline */}
              <h1 className="font-(--font-display) text-5xl md:text-6xl text-(--color-text-primary) text-center leading-tight mb-6">
                Where circular economy meets{' '}
                <em className="not-italic text-(--color-accent)">evidence.</em>
              </h1>

              {/* Subtitle */}
              <p className="text-base text-(--color-text-secondary) text-center max-w-lg mx-auto mt-3 leading-relaxed">
                Get an evidence-backed circularity score in minutes, grounded in real-world case
                studies.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <Button
                  variant="primary"
                  size="lg"
                  className="px-8"
                  onPress={() =>
                    document
                      .getElementById('assessment-form')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Start Assessment
                </Button>
                {!user && (
                  <Button variant="ghost" size="lg" onPress={() => navigate('/auth')}>
                    Sign Up
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Compact Feature Strip */}
        <div className="flex items-center justify-center gap-8 flex-wrap mb-10 py-6 border-y border-(--color-border)">
          {/* Assessment Methodology button */}
          <button
            onClick={openAssessmentMethodologyDrawer}
            className="flex items-center gap-2 text-xs text-(--color-text-muted) uppercase tracking-widest hover:text-(--color-accent) transition-colors"
          >
            <BookOpen size={14} />
            Assessment Methodology
          </button>

          <span className="text-(--color-border-strong)">·</span>

          {/* 3 feature pills inline */}
          <span className="text-xs text-(--color-text-muted)">AI-Powered Analysis</span>
          <span className="text-(--color-border-strong)">·</span>
          <span className="text-xs text-(--color-text-muted)">Multi-Dimensional Scoring</span>
          <span className="text-(--color-border-strong)">·</span>
          <span className="text-xs text-(--color-text-muted)">Actionable Results</span>

          <span className="text-(--color-border-strong)">·</span>

          {/* Evaluation Criteria button */}
          <button
            onClick={openEvaluationCriteriaDrawer}
            className="flex items-center gap-2 text-xs text-(--color-text-muted) uppercase tracking-widest hover:text-(--color-accent) transition-colors"
          >
            <Target size={14} />
            Evaluation Criteria
          </button>
        </div>

        {/* Assessment Form */}
        <section id="assessment-form" className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              {/* Section header */}
              <div className="border-t border-(--color-border) pt-12 mb-8">
                <h2 className="font-(--font-display) text-2xl text-(--color-text-primary) mb-1">
                  Evaluate Your Circular Economy Business
                </h2>
                <p className="text-sm text-(--color-text-muted)">
                  Describe your business idea using the same structure as real circular economy
                  projects.
                </p>
              </div>

              <div className="space-y-8">
                {/* Business Problem + Solution textareas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Business Problem */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-(--color-text-secondary) mb-2 items-center gap-1.5 flex">
                      Business Problem
                    </label>
                    <textarea
                      {...register('businessProblem')}
                      placeholder="What environmental or circular economy challenge does your business address?"
                      className="bg-transparent border border-(--color-border-strong) rounded-lg p-4 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none resize-none w-full min-h-40 transition-colors duration-150 font-(--font-body)"
                      rows={4}
                    />
                    <LiveCharacterCounter name="businessProblem" />
                  </div>

                  {/* Business Solution */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-(--color-text-secondary) mb-2 items-center gap-1.5 flex">
                      Business Solution
                    </label>
                    <textarea
                      {...register('businessSolution')}
                      placeholder="How does your business solve this problem? Include materials, processes, and circularity strategy."
                      className="bg-transparent border border-(--color-border-strong) rounded-lg p-4 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none resize-none w-full min-h-40 transition-colors duration-150 font-(--font-body)"
                      rows={5}
                    />
                    <LiveCharacterCounter name="businessSolution" />
                  </div>
                </div>

                {/* Business Context accordion */}
                <div
                  className="flex items-center justify-between py-4 border-t border-(--color-border) cursor-pointer group"
                  onClick={() => setShowBusinessContext(!showBusinessContext)}
                >
                  <div>
                    <span className="text-sm font-medium text-(--color-text-primary)">
                      Business Context
                    </span>
                    <span className="text-xs text-(--color-text-muted) ml-2">
                      — improves analysis quality
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-(--color-text-muted) transition-transform ${showBusinessContext ? 'rotate-180' : ''}`}
                  />
                </div>
                {showBusinessContext && <BusinessContextContainer loading={loading} />}

                {/* Evaluation Parameters accordion */}
                <div
                  className="flex items-center justify-between py-4 border-t border-(--color-border) cursor-pointer group"
                  onClick={() => setShowEvaluationParameters(!showEvaluationParameters)}
                >
                  <div>
                    <span className="text-sm font-medium text-(--color-text-primary)">
                      Evaluation Parameters
                    </span>
                    <span className="text-xs text-(--color-text-muted) ml-2">
                      — fine-tune scoring weights
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-(--color-text-muted) transition-transform ${showEvaluationParameters ? 'rotate-180' : ''}`}
                  />
                </div>
                {showEvaluationParameters && (
                  <EvaluationParametersContainer
                    loading={loading}
                    expandedKeys={innerExpandedKeys}
                    setExpandedKeys={setInnerExpandedKeys}
                  />
                )}

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

                {/* Evaluate Circularity button */}
                <div className="mt-8 mb-12">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-(--color-accent) text-white text-sm rounded-lg hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-(--font-body)"
                    onClick={handleSubmit(handleFormSubmit)}
                  >
                    {loading ? 'Evaluating...' : 'Evaluate Circularity'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sample Test Cases */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <SampleTestCasesContainer
              setShowEvaluationParameters={setShowEvaluationParameters}
              openEvalParams={openEvalParams}
              openBusinessContext={openBusinessContext}
            />
          </div>
        </section>
      </div>
    </FormProvider>
  );
}

LandingPage.propTypes = {};
