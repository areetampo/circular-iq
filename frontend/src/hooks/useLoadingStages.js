import { useState } from 'react';

import { scoreAssessmentStream } from '@/features/assessments/api/assessmentApi';

/**
 * Hook for managing real-time loading stages during assessment scoring
 * @returns {Object} { currentStage, startStream, reset }
 */
export function useLoadingStages() {
  const [currentStage, setCurrentStage] = useState('');

  /**
   * Start the streaming assessment process
   * @param {Object} formData - Form data to submit
   * @param {Object} callbacks - Callback functions for completion and error handling
   * @param {Function} callbacks.onComplete - Called when assessment completes successfully
   * @param {Function} callbacks.onError - Called when an error occurs
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
   * Reset the current stage back to empty
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
