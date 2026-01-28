import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MetricInfoModal from '../components/modals/MetricInfoModal';
import InfoIconButton from '../components/shared/InfoIconButton';
import ParameterSliders from '../components/forms/ParameterSliders';
import AssessmentMethodologyModal from '../components/modals/AssessmentMethodologyModal';
import EvaluationCriteriaModal from '../components/modals/EvaluationCriteriaModal';
import { getCharacterCount } from '../utils/text';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/shared/Logo';
import { cn } from '@/lib/utils';

export default function LandingView({
  businessProblem,
  setBusinessProblem,
  businessSolution,
  setBusinessSolution,
  parameters,
  setParameters,
  showAdvanced,
  setShowAdvanced,
  onSubmit,
  loading,
  error,
  showInfoIcons,
  testCaseSelector,
  onViewHistory,
}) {
  const [showInfoModal, setShowInfoModal] = useState(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  const handleParameterChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: parseInt(value, 10),
    }));
  };

  const isFormValid = businessProblem.trim().length >= 200 && businessSolution.trim().length >= 200;

  return (
    <div className="app-container">
      <div className="landing-view">
        {/* Header */}
        <div className="mb-8">
          <div className="logo-icon">
            <Logo />
          </div>
          <h1 className="main-title">Circular Economy Business Evaluator</h1>
          <p className="subtitle">
            Evaluate your business idea&apos;s circularity potential using AI-driven analysis
          </p>

          {/* Info Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button className="criteria-button" onClick={() => setShowMethodologyModal(true)}>
              📊 View Assessment Methodology
            </button>
            <button className="criteria-button" onClick={() => setShowCriteriaModal(true)}>
              📋 View Evaluation Criteria
            </button>
            {onViewHistory && (
              <button
                className="secondary-button text-sm px-5 py-2.5 hover:scale-105 transition-transform"
                onClick={onViewHistory}
              >
                📈 My Assessments
              </button>
            )}
          </div>
        </div>

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
                  {showInfoIcons && (
                    <InfoIconButton
                      onClick={() => setShowInfoModal('problem')}
                      title="Help with problem description"
                    />
                  )}
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
                value={businessProblem}
                onChange={(e) => setBusinessProblem(e.target.value)}
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
                  {showInfoIcons && (
                    <InfoIconButton
                      onClick={() => setShowInfoModal('solution')}
                      title="Help with solution description"
                    />
                  )}
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
                value={businessSolution}
                onChange={(e) => setBusinessSolution(e.target.value)}
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
          <div className="advanced-parameters">
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
              {showInfoIcons && (
                <div className="mt-[1.75px] -ml-2">
                  <InfoIconButton
                    onClick={() => setShowInfoModal('factors')}
                    title="Learn about evaluation factors"
                  />
                </div>
              )}
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
                  <ParameterSliders
                    parameters={parameters}
                    onParameterChange={handleParameterChange}
                    loading={loading}
                    onShowInfo={setShowInfoModal}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="submit-button" onClick={onSubmit} disabled={loading || !isFormValid}>
            {loading ? (
              <span className="loading-spinner">
                <span></span>
                <span></span>
                <span></span>
              </span>
            ) : (
              <>
                Evaluate Circularity <span>→</span>
              </>
            )}
          </button>

          {/* Test Case Selector */}
          {testCaseSelector}
        </div>

        {/* Footer */}
        <p className="footer-disclaimer">
          Based on research synthesis of AI applications in circular economy domains.
        </p>
      </div>

      {/* Info Modals */}
      {showInfoModal && (
        <MetricInfoModal onClose={() => setShowInfoModal(null)} type={showInfoModal} />
      )}

      {/* Assessment Methodology Modal */}
      <AssessmentMethodologyModal
        isOpen={showMethodologyModal}
        onClose={() => setShowMethodologyModal(false)}
      />

      {/* Evaluation Criteria Modal */}
      <EvaluationCriteriaModal
        isOpen={showCriteriaModal}
        onClose={() => setShowCriteriaModal(false)}
      />
    </div>
  );
}

LandingView.propTypes = {
  businessProblem: PropTypes.string.isRequired,
  setBusinessProblem: PropTypes.func.isRequired,
  businessSolution: PropTypes.string.isRequired,
  setBusinessSolution: PropTypes.func.isRequired,
  parameters: PropTypes.object.isRequired,
  setParameters: PropTypes.func.isRequired,
  showAdvanced: PropTypes.bool.isRequired,
  setShowAdvanced: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  showInfoIcons: PropTypes.bool,
  testCaseSelector: PropTypes.node,
  onViewHistory: PropTypes.func,
};

LandingView.defaultProps = {
  error: null,
  showInfoIcons: true,
  testCaseSelector: null,
  onViewHistory: null,
};
