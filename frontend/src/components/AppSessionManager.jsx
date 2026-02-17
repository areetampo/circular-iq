import { useEffect } from 'react';
import { useSession } from '@/features/session/hooks/useSession';
import { getMostRecentSession } from '@/utils/session';
import { useGlobalDialog } from '@/contexts/DialogContext';
import DIALOGS from '@/components/dialogs/dialogTypes';
import { useAuth } from '@/hooks/useAuth';

/**
 * Global session manager that shows restore prompt on any route
 * if there's restorable session data
 */
// Track shown prompts for this page load to prevent loops
const _shownSessionThisLoad = new Set();

export function AppSessionManager() {
  const { user } = useAuth();
  const { sessionId, hasRestorableSession, sessionData, hasEvaluationState, restoreEvaluation } =
    useSession();
  const { openSessionRestoreDialog, dialog } = useGlobalDialog();
  useEffect(() => {
    // Don't show prompt if dialog is already open
    if (dialog?.type === DIALOGS.SESSION_RESTORE) return;

    let dataToRestore = null;

    // Priority order: restorable session > evaluation state > direct storage lookup
    if (hasRestorableSession && sessionData) {
      dataToRestore = sessionData;
    } else if (hasEvaluationState) {
      try {
        dataToRestore = restoreEvaluation();
      } catch (e) {
        dataToRestore = null;
        console.warn('Failed to restore evaluation state:', e);
      }
    } else {
      try {
        const direct = getMostRecentSession();
        if (direct) dataToRestore = direct;
      } catch (e) {
        console.warn('Failed to read session directly from storage:', e);
      }
    }

    if (!dataToRestore) return;

    // Check if there are actually inputs or results to restore
    const hasInputs = Boolean(
      dataToRestore.inputs?.businessProblem ||
      dataToRestore.inputs?.businessSolution ||
      dataToRestore.businessProblem ||
      dataToRestore.businessSolution,
    );

    const hasResults = Boolean(
      dataToRestore.results ||
      dataToRestore.calculatedResults ||
      dataToRestore.result_json ||
      (dataToRestore &&
        typeof dataToRestore === 'object' &&
        Object.keys(dataToRestore).some(
          (key) => key.includes('score') || key.includes('result') || key.includes('audit'),
        )),
    );

    // Skip if nothing to restore
    if (!hasInputs && !hasResults) return;

    // Use timestamp to avoid showing prompt multiple times for same session
    // (Global dedup - shows once per SPA navigation session).
    // However we want to show the prompt on full page reloads.
    const currentTs = dataToRestore?.timestamp || '';
    const sessionKey = `sessionPrompt_shown_${sessionId || 'anon'}_${currentTs}`;
    const hasShownForSession = sessionStorage.getItem(sessionKey) === 'true';

    // Prevent re-opening during same page load using an in-memory marker keyed by sessionId
    const shownMarkerKey = sessionId || 'anon';
    if (_shownSessionThisLoad.has(shownMarkerKey) && !isFullReload) return;

    // Detect full page reload/navigation (not SPA internal navigation) using
    // the modern Navigation Timing API. Avoid using the deprecated
    // `performance.navigation` API to prevent deprecation warnings.
    let isFullReload = false;
    try {
      if (performance?.getEntriesByType) {
        const entries = performance.getEntriesByType('navigation');
        if (entries && entries.length > 0) {
          const navType = entries[0].type; // 'reload', 'navigate', 'back_forward'
          isFullReload = navType === 'reload' || navType === 'navigate';
        }
      }
    } catch {
      // If the Navigation Timing API is unavailable, treat as SPA navigation
      // (do not force prompt). This avoids calling deprecated APIs.
    }

    // If we've already shown for this SPA session and it's not a full reload, skip
    if (hasShownForSession && !isFullReload) return;

    // Show the prompt. Set the sessionStorage flag immediately to avoid
    // re-opening the dialog multiple times during the same page load
    // (the onDismiss handler still remains for compatibility).
    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch (e) {
      console.warn('Failed to set session prompt flag in storage before open:', e);
    }

    openSessionRestoreDialog({
      sessionData: dataToRestore,
      onDismiss: () => {
        try {
          sessionStorage.setItem(sessionKey, 'true');
        } catch (e) {
          console.warn('Failed to set session prompt flag in storage:', e);
        }
      },
    });
  }, [
    hasRestorableSession,
    sessionData,
    hasEvaluationState,
    openSessionRestoreDialog,
    dialog?.type,
    user,
    restoreEvaluation,
  ]);

  return null;
}

export default AppSessionManager;
