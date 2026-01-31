import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InfoIconButton from '@/components/common/InfoIconButton';
import ParameterInputContainer from '@/pages/LandingPage/components/ParameterInputContainer';
import SampleTestCasesContainer from '@/pages/LandingPage/components/SampleTestCasesContainer';
import SessionRestorePrompt from '@/features/session/components/SessionRestorePrompt';
import { useSession } from '@/features/session/hooks/useSession';
import { getCharacterCount } from '@/lib/validation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import BusinessProblemInfoModal from '@/components/modals/landing/BusinessProblemInfoModal';
import Loader from '@/components/common/Loader';
import AppContainer from '@/components/layout/AppContainer';
import { assessmentSchema, defaultValues } from '@/features/assessments/validation';
import { scoreAssessment } from '@/features/assessments/api/assessmentApi';
import './LandingPage.css';

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
    try {
      setLoading(true);
      setError(null);
      const result = await scoreAssessment(formData);
      clearEvaluation();
      // Navigate to results page with the result data
      navigate('/results', { state: { result, formData } });
    } catch (err) {
      setError(err.message || 'Failed to evaluate. Please try again.');
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
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon bg-orange-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2" />
                <path
                  d="M12 6 L12 12 L16 14"
                  stroke="#ff9800"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>AI-Powered</h3>
            <p>Machine learning analysis based on circular economy principles</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-blue-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
                <rect x="13" y="3" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
                <rect x="3" y="13" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
                <rect x="13" y="13" width="6" height="6" stroke="#2196f3" strokeWidth="2" />
              </svg>
            </div>
            <h3>Multi-Dimensional</h3>
            <p>Evaluates across 5 key circular economy domains</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-green-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12 L10 17 L20 7"
                  stroke="#4caf50"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Actionable</h3>
            <p>Receive specific recommendations for improvement</p>
          </div>
        </div>

        {/* Input Form */}
        <div className="p-8 mb-8 text-left bg-white shadow-md rounded-2xl">
          <h2 className="mb-2 text-2xl font-bold">Evaluate Your Circular Economy Business</h2>
          <p className="input-instructions">
            Describe your business idea using the same structure as real circular economy projects:
            what problem you solve, and how your solution addresses it.
          </p>

          {/* One-Column Input Container */}
          <div className="input-fields-container">
            {/* Problem Input */}
            <div className="input-field">
              <div className="ml-2">
                <div className="field-header">
                  <label htmlFor="business-problem">
                    <p className="text-lg font-semibold">Business Problem</p>
                  </label>
                  <InfoIconButton
                    // onClick={() => setShowInfoModal('problem')}
                    title="Help with problem description"
                  />
                  {/* Info Modal */}
                  <BusinessProblemInfoModal
                  // isOpen={showInfoModal === 'problem'}
                  // onClose={() => setShowInfoModal(null)}
                  />
                </div>
                <p className="field-guidance" id="problem-guidance">
                  What environmental or circular economy challenge does your business address?
                </p>
              </div>
              <textarea
                id="business-problem"
                className="idea-textarea"
                rows="4"
                placeholder="Example: Single-use plastic packaging creates 8 million tons of ocean waste annually, depleting marine ecosystems and poisoning food chains. Current alternatives are either cost-prohibitive or require complex infrastructure..."
                {...register('businessProblem')}
                disabled={loading}
                aria-describedby="problem-guidance"
              />
              <div
                className={cn(
                  'font-semibold text-sm ml-2 mt-2',
                  getCharacterCount(businessProblem) >= 200 ? 'text-emerald-500' : 'text-red-800',
                )}
              >
                {getCharacterCount(businessProblem)} / 200 characters
              </div>
            </div>

            {/* Solution Input */}
            <div className="input-field">
              <div className="ml-2">
                <div className="field-header">
                  <label htmlFor="business-solution">
                    <p className="text-lg font-semibold">Business Solution</p>
                  </label>
                  <InfoIconButton
                    // onClick={() => setShowInfoModal('solution')}
                    title="Help with solution description"
                  />
                </div>
                <p className="field-guidance" id="solution-guidance">
                  How does your business solve this problem? Include materials, processes, and
                  circularity strategy.
                </p>
              </div>
              <textarea
                id="business-solution"
                className="idea-textarea"
                rows="4"
                placeholder="Example: Our platform uses compostable packaging from agricultural hemp waste, combined with a hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we aggregate returns at regional hubs; certified composting facilities process 95% of materials into soil amendments sold back to agriculture..."
                {...register('businessSolution')}
                disabled={loading}
                aria-describedby="solution-guidance"
              />
              <div
                className={cn(
                  'font-semibold text-sm ml-2 mt-2',
                  getCharacterCount(businessSolution) >= 200 ? 'text-emerald-500' : 'text-red-800',
                )}
              >
                {getCharacterCount(businessSolution)} / 200 characters
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 text-red-800 border-2 border-red-400 rounded-lg bg-red-50">
              <strong>⚠ Validation Error:</strong>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}

          {/* Advanced Parameters Section */}
          <div className="evaluation-parameters">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2 p-2 mt-0.5 text-base font-semibold transition-colors border-none cursor-pointer bg-none text-emerald-600 hover:text-emerald-700"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span
                  className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : 'rotate-0'}`}
                >
                  ▶
                </span>
                Advanced Parameters
              </button>
              <div className="mt-[1.75px] -ml-2">
                <InfoIconButton
                  // onClick={() => setShowInfoModal('factors')}
                  title="Learn about evaluation factors"
                />
              </div>
            </div>

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

          <button
            className="submit-button"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={loading || !isValid}
          >
            {loading ? (
              <Loader heading="Evaluating..." message="This may take a few moments..." />
            ) : (
              <>
                Evaluate Circularity <span>→</span>
              </>
            )}
          </button>

          {/* Test Case Selector */}
          <SampleTestCasesContainer />
        </div>
      </AppContainer>
    </FormProvider>
  );
}

LandingPage.propTypes = {};
