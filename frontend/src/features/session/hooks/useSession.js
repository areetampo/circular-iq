import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSessionId,
  loadEvaluationState,
  saveEvaluationState,
  clearEvaluationState,
  hasEvaluationContent,
} from '@/lib/storage';

/**
 * Hook for managing user session with React Query
 * Unified for both anonymous and authenticated users
 */
export function useSession() {
  const { user } = useAuth();

  // Query for session data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const sessionId = getSessionId();
      const evaluationState = loadEvaluationState();
      return {
        sessionId,
        evaluationState,
        hasEvaluationState: Boolean(evaluationState),
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [hasRestorableSession, setHasRestorableSession] = useState(false);
  const [restorableSessionData, setRestorableSessionData] = useState(null);

  // Check for restorable session whenever data changes
  useEffect(() => {
    const evalState = loadEvaluationState();

    if (evalState) {
      const hasContent = Boolean(
        evalState.inputs?.businessProblem?.trim() ||
        evalState.inputs?.businessSolution?.trim() ||
        evalState.results,
      );

      if (hasContent) {
        setHasRestorableSession(true);
        setRestorableSessionData(evalState);
      } else {
        setHasRestorableSession(false);
        setRestorableSessionData(null);
      }
    } else {
      setHasRestorableSession(false);
      setRestorableSessionData(null);
    }
  }, [data, user]);

  // Helper functions
  const saveEvaluation = (state) => {
    saveEvaluationState(state);
    refetch();
  };

  const clearEvaluation = () => {
    clearEvaluationState();
    refetch();
  };

  const restoreEvaluation = () => data?.evaluationState || null;

  // Unified session helpers (work for both anonymous and authenticated)
  const saveSession = (sessionData) => {
    saveEvaluationState(sessionData);
    refetch();
  };

  const clearSession = () => {
    clearEvaluationState();
    setHasRestorableSession(false);
    setRestorableSessionData(null);
    refetch();
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

    // Session restore helpers
    hasRestorableSession,
    sessionData: restorableSessionData,
    saveSession,
    clearSession,
    hasValidAnonymousSession: hasEvaluationContent,
  };
}
