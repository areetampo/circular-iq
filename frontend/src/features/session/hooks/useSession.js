import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSessionId,
  loadEvaluationState,
  saveEvaluationState,
  clearEvaluationState,
  getAnonymousSession,
  saveAnonymousSession,
  clearAnonymousSession,
  hasValidAnonymousSession,
} from '@/utils/session';

/**
 * Hook for managing user session with React Query
 * Handles session ID and evaluation state persistence
 */
export function useSession() {
  const { user } = useAuth();

  // Query for persistent session data (IDs, evaluation draft)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const sessionId = getSessionId();
      const evaluationState = loadEvaluationState();
      return {
        sessionId,
        evaluationState,
        hasEvaluationState: !!evaluationState,
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [hasRestorableSession, setHasRestorableSession] = useState(false);
  const [restorableSessionData, setRestorableSessionData] = useState(null);

  useEffect(() => {
    if (user) {
      // Clear anonymous session when user logs in
      try {
        clearAnonymousSession();
      } catch (e) {
        // ignore
      }
      setHasRestorableSession(false);
      setRestorableSessionData(null);
      return;
    }

    // For anonymous users check local anonymous session
    const anon = getAnonymousSession();
    if (anon) {
      setHasRestorableSession(true);
      setRestorableSessionData(anon);
    } else {
      setHasRestorableSession(false);
      setRestorableSessionData(null);
    }
  }, [user]);

  // Helper functions for managing session state
  const saveEvaluation = (state) => {
    saveEvaluationState(state);
    refetch();
  };

  const clearEvaluation = () => {
    clearEvaluationState();
    refetch();
  };

  const restoreEvaluation = () => data?.evaluationState || null;

  // Anonymous session helpers
  const saveSession = saveAnonymousSession;
  const clearSession = () => {
    clearAnonymousSession();
    // ensure local hook state clears
    setHasRestorableSession(false);
    setRestorableSessionData(null);
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

    // Anonymous/session restore helpers
    hasRestorableSession,
    sessionData: restorableSessionData,
    saveSession,
    clearSession,
    hasValidAnonymousSession,
  };
}
