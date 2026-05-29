import { toast } from '@heroui/react';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import DIALOGS from '@/constants/dialogTypes';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { evaluationFormDefaults } from '@/features/assessments/validation';
import { useAuth } from '@/hooks';
import { getSession, getSessionId } from '@/utils/session';

/**
 * Checks whether evaluation inputs still match the untouched form defaults.
 *
 * @param {{ businessProblem?: string, businessSolution?: string, evaluationParameters?: Record<string, number>, businessContext?: Record<string, unknown> }|null|undefined} inputs - Persisted evaluation form inputs to compare with defaults.
 * @returns {boolean} `true` when no meaningful user input has been entered.
 */
function isAtDefaultValues(inputs) {
  if (!inputs) return true;

  const inputsAtDefaults =
    (!inputs.businessProblem || inputs.businessProblem.trim() === '') &&
    (!inputs.businessSolution || inputs.businessSolution.trim() === '') &&
    JSON.stringify(inputs.evaluationParameters || {}) ===
      JSON.stringify(evaluationFormDefaults.evaluationParameters) &&
    JSON.stringify(inputs.businessContext || {}) ===
      JSON.stringify(evaluationFormDefaults.businessContext);

  return inputsAtDefaults;
}

/**
 * Checks whether the results-restore dialog mute flag is still active and clears expired flags.
 *
 * @returns {boolean} `true` when localStorage contains an unexpired mute flag.
 */
function isDialogMuted() {
  const isMuted = localStorage.getItem('results_restore_dialog_muted') === 'true';
  const expirationTime = localStorage.getItem('results_restore_dialog_muted_expiration');

  if (!isMuted || !expirationTime) {
    return false;
  }

  // Expired mute flags should not suppress future restore prompts.
  if (Date.now() > parseInt(expirationTime, 10)) {
    localStorage.removeItem('results_restore_dialog_muted');
    localStorage.removeItem('results_restore_dialog_muted_expiration');
    return false;
  }

  return true;
}

/**
 * On full page load only, prompts to restore evaluation session or shows landing toasts; uses `useGlobalDialog`.
 */
export default function AppSessionManager() {
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { openResultsRestoreDialog, dialog } = useGlobalDialog();

  const hasCheckedOnLoad = useRef(false);
  const hasShownInputsToast = useRef(false); // track home-input-toast display

  const currentSessionId = useRef(getSessionId()); // Track session ID changes

  useEffect(() => {
    // Only run once on component mount (page load)
    if (hasCheckedOnLoad.current) return;

    // Skip if dialog is already open
    if (dialog?.type === DIALOGS.SESSION_RESTORE) return;

    // Skip on auth, assessment view, or share pages
    if (
      location.pathname.startsWith('/auth') ||
      location.pathname.startsWith('/assessments/') ||
      location.pathname.startsWith('/share/')
    ) {
      hasCheckedOnLoad.current = true;
      return;
    }

    // Detect if this is a page load/refresh (not SPA navigation)
    let isPageLoad = false;
    try {
      const perfEntries = performance.getEntriesByType('navigation');
      if (perfEntries && perfEntries.length > 0) {
        const navType = perfEntries[0].type;
        // 'navigate' = first load, 'reload' = F5/refresh, 'back_forward' = browser back/forward
        isPageLoad = navType === 'navigate' || navType === 'reload' || navType === 'back_forward';
      } else {
        // Fallback: if performance API unavailable, treat as page load on first mount
        isPageLoad = true;
      }
    } catch {
      // If performance API fails, assume page load
      isPageLoad = true;
    }

    if (!isPageLoad) {
      hasCheckedOnLoad.current = true;
      return;
    }

    // Get session data
    let sessionData = null;
    try {
      sessionData = getSession();
    } catch (error) {
      logger.error('[SESSION_MANAGER:READ_FAILED]', error);
      hasCheckedOnLoad.current = true;
      return;
    }

    // ALWAYS show input-restore toast when appropriate on home path
    // Skip if user is coming from re-evaluate (has formData in location.state)
    // Skip if inputs are at default values (prevents toast after login/signup)
    if (
      location.pathname === '/' &&
      sessionData?.inputs &&
      !hasShownInputsToast.current &&
      !location.state?.formData &&
      !isAtDefaultValues(sessionData.inputs)
    ) {
      // delay until after render/paint
      setTimeout(() => {
        toast.info('Previous inputs restored.', { timeout: 2500 });
      }, 0);
      hasShownInputsToast.current = true;
    }

    if (!sessionData) {
      hasCheckedOnLoad.current = true;
      return;
    }

    // Only show the *restore prompt* for persisted RESULTS snapshots.
    // Inputs-only sessions are auto-synced and should NOT trigger a modal prompt.
    const hasResults = Boolean(sessionData.results);

    if (!hasResults) {
      // mark as checked and do not show restore dialog for inputs-only sessions
      hasCheckedOnLoad.current = true;
      return;
    }

    // If the user is already on the Results page and a result snapshot exists
    // in persisted session state, do NOT show the global session-restore prompt
    // (the user is already viewing their evaluation). This prevents the restore
    // dialog from blocking the Save flow after sign-in.
    if (location.pathname.startsWith('/results') && sessionData.results) {
      hasCheckedOnLoad.current = true;
      return;
    }

    // Mark as checked before showing dialog
    hasCheckedOnLoad.current = true;

    // Check if dialog is muted before showing
    if (isDialogMuted()) {
      return;
    }

    // Show restore dialog (only for sessions that include results)
    openResultsRestoreDialog();
  }, []); // Empty deps = run once on mount only

  // Show input restore toast when user navigates to home via SPA (only once)
  useEffect(() => {
    if (hasShownInputsToast.current) return;
    if (location.pathname !== '/') return;

    // Skip if user is coming from re-evaluate (has formData in location.state)
    if (location.state?.formData) return;

    let sessionData = null;
    try {
      sessionData = getSession();
    } catch {
      return;
    }

    // Skip if inputs are at default values (prevents toast after login/signup)
    if (sessionData?.inputs && !isAtDefaultValues(sessionData.inputs)) {
      setTimeout(() => {
        toast.info('Previous inputs restored.', { timeout: 2500 });
      }, 0);
      hasShownInputsToast.current = true;
    }
  }, [location.pathname, location.state]);

  // Monitor session ID changes when authentication state changes
  useEffect(() => {
    const newSessionId = getSessionId();
    if (newSessionId !== currentSessionId.current) {
      logger.log('[SESSION_ID_CHANGED]', {
        oldSessionId: currentSessionId.current,
        newSessionId,
        isAuthenticated,
        timestamp: new Date().toISOString(),
      });
      currentSessionId.current = newSessionId;
    }
  }, [isAuthenticated]);

  // Post-login automatic save prompt intentionally disabled.
  // Users must explicitly click the Save button on the Results page to save.
  // This avoids intrusive modal prompts immediately after sign-in.
  // (No-op; handled by ResultsPage when user manually clicks Save.)

  return null;
}

AppSessionManager.propTypes = {};
