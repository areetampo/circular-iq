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
      // User just logged in - check if they have anonymous session to migrate
      const anonSession = getAnonymousSession();

      if (anonSession) {
        try {
          const pendingSave = localStorage.getItem('ce_pending_save');
          const inputsToMigrate = anonSession.inputs || {};
          const resultsToMigrate = !pendingSave && anonSession.results ? anonSession.results : null;

          if ((inputsToMigrate && Object.keys(inputsToMigrate).length > 0) || resultsToMigrate) {
            // Save to evaluation state
            saveEvaluationState({
              businessProblem: inputsToMigrate?.businessProblem || '',
              businessSolution: inputsToMigrate?.businessSolution || '',
              parameters: inputsToMigrate?.parameters || {},
              calculatedResults: resultsToMigrate || null,
              hasUnsavedResults: Boolean(resultsToMigrate),
              migratedFromAnonymous: true,
              timestamp: anonSession.timestamp,
            });

            // Keep the data available for session restore prompt
            setHasRestorableSession(true);
            setRestorableSessionData({
              inputs: inputsToMigrate,
              results: resultsToMigrate,
              calculatedResults: resultsToMigrate,
              timestamp: anonSession.timestamp,
              fromAnonymous: true,
            });
          }

          // Clear anonymous session after migration
          try {
            clearAnonymousSession();
          } catch (e) {
            console.error('Failed to clear anonymous session:', e);
          }

          // Trigger a refetch to update evaluation state
          refetch();
        } catch (e) {
          console.error('Error during anonymous session migration:', e);
        }

        return;
      }

      // No anonymous session to migrate - clear restore state
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
