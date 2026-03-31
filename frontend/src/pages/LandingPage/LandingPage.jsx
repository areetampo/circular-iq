import { toast } from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Lightbulb, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Chip } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { useSession } from '@/features/session/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import { getCharacterCount } from '@/lib/validation';

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
        <section className="pt-16 pb-8">
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
              <h1 className="font-(--font-display) text-4xl lg:text-6xl text-(--color-text-primary) leading-tight mb-6">
                Where circular economy
                <br className="hidden lg:block" />
                meets <em className="italic text-(--color-accent)">evidence.</em>
              </h1>

              {/* Subtitle */}
              <p className="text-base text-(--color-text-secondary) text-center max-w-lg mx-auto mt-3 leading-relaxed">
                Get an evidence-backed circularity score in minutes, grounded in real-world case
                studies.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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

        {/* Feature Cards */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-12">
                <h2 className="font-(--font-display) text-3xl text-(--color-text-primary) mb-4">
                  Why choose our assessment?
                </h2>
                <p className="text-lg text-(--color-text-secondary) max-w-2xl mx-auto">
                  Comprehensive analysis powered by AI and grounded in circular economy principles.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
                {/* AI-Powered */}
                <div className="text-center">
                  <div className="w-8 h-8 bg-(--color-accent-light) rounded-sm flex items-center justify-center mb-3 mx-auto">
                    <RefreshCw className="w-4 h-4 text-(--color-accent)" />
                  </div>
                  <h3 className="text-sm font-semibold text-(--color-text-primary) mb-1">
                    AI-Powered
                  </h3>
                  <p className="text-xs text-(--color-text-muted) leading-relaxed">
                    Machine learning analysis grounded in circular economy principles and real-world
                    data.
                  </p>
                </div>

                {/* Multi-Dimensional */}
                <div className="text-center">
                  <div className="w-8 h-8 bg-(--color-accent-light) rounded-sm flex items-center justify-center mb-3 mx-auto">
                    <BarChart3 className="w-4 h-4 text-(--color-accent)" />
                  </div>
                  <h3 className="text-sm font-semibold text-(--color-text-primary) mb-1">
                    Multi-Dimensional
                  </h3>
                  <p className="text-xs text-(--color-text-muted) leading-relaxed">
                    Evaluates across key domains for clarity and depth of analysis.
                  </p>
                </div>

                {/* Actionable */}
                <div className="text-center">
                  <div className="w-8 h-8 bg-(--color-accent-light) rounded-sm flex items-center justify-center mb-3 mx-auto">
                    <Lightbulb className="w-4 h-4 text-(--color-accent)" />
                  </div>
                  <h3 className="text-sm font-semibold text-(--color-text-primary) mb-1">
                    Actionable
                  </h3>
                  <p className="text-xs text-(--color-text-muted) leading-relaxed">
                    Clear recommendations you can apply immediately to improve circularity outcomes.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Assessment Form */}
        <section id="assessment-form" className="py-8">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              {/* Section divider */}
              <div className="border-t border-(--color-border)" />

              {/* Section header */}
              <div className="pt-8">
                <h2 className="font-(--font-display) text-2xl text-(--color-text-primary) mb-1">
                  Evaluate Your Circular Economy Business
                </h2>
                <p className="text-sm text-(--color-text-muted) mb-8">
                  Describe your business idea using the same structure as real circular economy
                  projects.
                </p>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Problem */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-2 flex items-center gap-1">
                      Business Problem *
                    </label>
                    <textarea
                      {...register('businessProblem')}
                      placeholder="What environmental or circular economy challenge does your business address?"
                      className="bg-[rgba(245,240,232,0.5)] border border-(--color-border-strong) rounded-md p-4 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) resize-none transition-all outline-none w-full min-h-35"
                      rows={4}
                    />
                    <p className="text-xs text-(--color-text-muted) text-right mt-1">
                      Minimum 200 characters
                    </p>
                  </div>

                  {/* Business Solution */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-2 flex items-center gap-1">
                      Business Solution *
                    </label>
                    <textarea
                      {...register('businessSolution')}
                      placeholder="How does your business solve this problem? Include materials, processes, and circularity strategy."
                      className="bg-[rgba(245,240,232,0.5)] border border-(--color-border-strong) rounded-md p-4 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) resize-none transition-all outline-none w-full min-h-35"
                      rows={5}
                    />
                    <p className="text-xs text-(--color-text-muted) text-right mt-1">
                      Minimum 200 characters
                    </p>
                  </div>
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

                {/* Submit Button */}
                <div className="text-center my-8">
                  <Button
                    variant="primary"
                    className="py-3.5 text-base font-medium"
                    isLoading={loading}
                    isDisabled={!isValid}
                    onPress={handleSubmit(handleFormSubmit)}
                  >
                    {loading ? 'Evaluating...' : 'Evaluate Circularity'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sample Test Cases */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              {/* Section header with info icon and collapse */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-(--font-display) text-lg text-(--color-text-primary) mb-1">
                    Sample Test Cases
                  </h2>
                  <p className="text-sm text-(--color-text-muted)">
                    Auto-fill the form with curated examples for quick testing
                  </p>
                </div>
                <button className="text-(--color-text-muted) hover:text-(--color-text-primary)">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-(--color-border) mb-6" />

              {/* Test cases grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_TEST_CASES.map((testCase, index) => (
                  <motion.div
                    key={testCase.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-[rgba(245,240,232,0.5)] border border-(--color-border) rounded-md p-4 cursor-pointer hover:border-(--color-accent) hover:bg-(--color-accent-light) transition-all"
                    onClick={() => handleSampleTestSelect(testCase)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Number badge */}
                      <div className="text-xs font-mono text-(--color-text-muted) bg-(--color-accent-light) rounded-sm px-1.5 py-0.5 mr-2">
                        #{index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-(--color-text-primary) mb-1">
                          {testCase.title}
                        </h3>
                        <p className="text-xs text-(--color-text-muted) mt-1 line-clamp-2 leading-relaxed">
                          {testCase.businessProblem}
                        </p>

                        {/* Score chips */}
                        <div className="flex gap-2 mt-2">
                          <Chip variant="score">
                            {testCase.evaluationParameters.material_efficiency}/5
                          </Chip>
                          <Chip variant="score">
                            {testCase.evaluationParameters.business_model_innovation}/5
                          </Chip>
                        </div>

                        {/* View details link */}
                        <button className="text-xs text-(--color-accent) hover:underline flex items-center gap-1 mt-2">
                          View details
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </FormProvider>
  );
}

LandingPage.propTypes = {};
