import { useState } from 'react';

import { scoreAssessmentStream } from '@/features/assessments/api/assessmentApi';

/**
 * Tracks live scoring-stage messages from the assessment SSE stream.
 * `startStream` delegates lifecycle handling to `scoreAssessmentStream` and forwards completion/error callbacks.
 *
 * @returns {{
 *   currentStage: string,
 *   startStream: (
 *     formData: Object,
 *     callbacks: { onComplete?: (result: Object) => void, onError?: (error: unknown) => void }
 *   ) => void,
 *   reset: () => void
 * }} Live stage state plus controls to start or reset the scoring stream.
 */
export default function useLoadingStages() {
  const [currentStage, setCurrentStage] = useState('');

  const startStream = (formData, callbacks) => {
    const { onComplete, onError } = callbacks;

    scoreAssessmentStream(
      formData,
      (stage, message) => {
        setCurrentStage(message);
      },
      (result) => {
        if (onComplete) {
          onComplete(result);
        }
      },
      (error) => {
        if (onError) {
          onError(error);
        }
      },
    );
  };

  const reset = () => {
    setCurrentStage('');
  };

  return {
    currentStage,
    startStream,
    reset,
  };
}
