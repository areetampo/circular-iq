/**
 * @module useLoadingStages
 * @description Custom hook for managing real-time assessment scoring progress.
 * Tracks and displays the current processing stage during streaming assessment
 * evaluations. Integrates with SSE streaming for real-time progress updates.
 */

import { useState } from 'react';

import { scoreAssessmentStream } from '@/features/assessments/api/assessmentApi';

/**
 * Hook for managing real-time loading stages during assessment scoring.
 * Handles streaming assessment process and updates UI with current processing stage.
 *
 * @returns {Object} Loading stage management interface.
 * @returns {string} returns.currentStage - Description of the current processing stage (empty when idle).
 * @returns {Function} returns.startStream - Start the streaming assessment process.
 * @returns {Function} returns.reset - Reset the current stage back to empty string.
 *
 * @example
 * const { currentStage, startStream, reset } = useLoadingStages();
 * startStream(formData, {
 *   onComplete: (result) => logger.log('Done!', result),
 *   onError: (err) => logger.error('Error:', err)
 * });
 * logger.info("current processing stage:", currentStage); // Current processing message
 */
export default function useLoadingStages() {
  const [currentStage, setCurrentStage] = useState('');

  /**
   * Start the streaming assessment process.
   * Calls the assessment API with streaming and invokes callbacks for stage updates,
   * completion, and error handling.
   *
   * @param {Object} formData - Assessment form data to submit.
   * @param {string} formData.name - Assessment name.
   * @param {string} formData.industry - Industry classification.
   * @param {string} formData.businessProblem - Problem description.
   * @param {string} formData.businessSolution - Solution description.
   * @param {Object} formData.parameters - Evaluation parameters.
   * @param {Object} callbacks - Callback functions for streaming lifecycle.
   * @param {Function} [callbacks.onComplete] - Called when assessment completes successfully.
   *                                            Receives the final scoring result.
   * @param {Function} [callbacks.onError] - Called when an error occurs during assessment.
   *                                         Receives the error object.
   */
  const startStream = (formData, callbacks) => {
    const { onComplete, onError } = callbacks;

    scoreAssessmentStream(
      formData,
      // onStage callback - update current stage message
      (stage, message) => {
        setCurrentStage(message);
      },
      // onComplete callback
      (result) => {
        if (onComplete) {
          onComplete(result);
        }
      },
      // onError callback
      (err) => {
        if (onError) {
          onError(err);
        }
      },
    );
  };

  /**
   * Reset the current stage back to empty string.
   * Called after assessment completes or when starting a new assessment.
   */
  const reset = () => {
    setCurrentStage('');
  };

  return {
    currentStage,
    startStream,
    reset,
  };
}
