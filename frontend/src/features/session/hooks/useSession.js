import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks';
import {
  clearEvaluationState,
  hasEvaluationContent,
  loadEvaluationState,
  saveEvaluationState,
} from '@/lib/storage';
import { getSessionId } from '@/utils/session';

/**
 * Loads anonymous session id and persisted evaluation state; depends on `useAuth` and React Query.
 *
 * @returns {{
 *   sessionId: string|null,
 *   evaluationState: Object|null,
 *   hasEvaluationState: boolean,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: string|null,
 *   refetch: Function,
 *   saveEvaluation: (state: Object) => void,
 *   clearEvaluation: () => void,
 *   restoreEvaluation: () => Object|null,
 *   hasRestorableSession: boolean,
 *   sessionData: Object|null,
 *   saveSession: (sessionData: Object) => void,
 *   clearSession: () => void,
 *   hasValidAnonymousSession: (state: Object) => boolean
 * }} Anonymous/session persistence state, restore helpers, and storage mutation callbacks.
 */
export default function useSession() {
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
      const hasInputs = Boolean(
        evalState.inputs?.businessProblem?.trim() ||
        evalState.inputs?.businessSolution?.trim() ||
        Object.keys(evalState.inputs?.businessContext || {}).length > 0 ||
        Object.keys(evalState.inputs?.evaluationParameters || {}).length > 0,
      );

      const hasContent = hasInputs || Boolean(evalState.results);

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
