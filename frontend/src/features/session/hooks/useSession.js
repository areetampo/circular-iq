import { useQuery } from '@tanstack/react-query';
import { getSessionId, loadEvaluationState, saveEvaluationState, clearEvaluationState } from '@/utils/session';

/**
 * Hook for managing user session with React Query
 * Handles session ID and evaluation state persistence
 */
export function useSession() {
  // Query for session data (session ID and evaluation state)
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      // Get or create session ID
      const sessionId = getSessionId();
      
      // Load saved evaluation state if any
      const evaluationState = loadEvaluationState();
      
      return {
        sessionId,
        evaluationState,
        hasEvaluationState: !!evaluationState,
      };
    },
    staleTime: Infinity, // Session data doesn't go stale
    gcTime: Infinity, // Keep session in cache
  });

  // Helper functions for managing session state
  const saveEvaluation = (state) => {
    saveEvaluationState(state);
    refetch(); // Refresh query to update hasEvaluationState
  };

  const clearEvaluation = () => {
    clearEvaluationState();
    refetch(); // Refresh query to update hasEvaluationState
  };

  const restoreEvaluation = () => {
    return data?.evaluationState || null;
  };

  return {
    sessionId: data?.sessionId || null,
    evaluationState: data?.evaluationState || null,
    hasEvaluationState: data?.hasEvaluationState || false,
    isLoading,
    isError,
    error: error?.message || null,
    refetch,
    saveEvaluation,
    clearEvaluation,
    restoreEvaluation,
  };
}
