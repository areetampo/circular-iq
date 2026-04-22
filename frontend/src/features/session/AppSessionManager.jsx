import { toast } from '@heroui/react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import DIALOGS from '@/components/dialogs/dialogTypes';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { useAuth } from '@/hooks/useAuth';
import { getSessionId } from '@/lib/storage';
import { getSession } from '@/utils/session';

/**
 * Check if the results restore dialog is muted
 * @returns {boolean} True if dialog is muted and not expired
 */
function isDialogMuted() {
  const isMuted = localStorage.getItem('results_restore_dialog_muted') === 'true';
  const expirationTime = localStorage.getItem('results_restore_dialog_muted_expiration');

  if (!isMuted || !expirationTime) {
    return false;
  }

  // Check if expiration time has passed
  if (Date.now() > parseInt(expirationTime, 10)) {
    // Clean up expired mute settings
    localStorage.removeItem('results_restore_dialog_muted');
    localStorage.removeItem('results_restore_dialog_muted_expiration');
    return false;
  }

  return true;
}

/**
 * Global session manager that shows restore prompt ONLY on page load/refresh
 * NOT on SPA navigation
 */
export function AppSessionManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openResultsRestoreDialog, dialog } = useGlobalDialog();
  const { isAuthenticated } = useAuth();
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
    } catch (e) {
      logger.error('Failed to read session:', e);
      hasCheckedOnLoad.current = true;
      return;
    }

    // ALWAYS show input-restore toast when appropriate on home path
    if (location.pathname === '/' && sessionData?.inputs && !hasShownInputsToast.current) {
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
    openResultsRestoreDialog({
      sessionData: sessionData,
      onDismiss: () => {
        // User dismissed - stay on the same page
        navigate(location.pathname);
      },
    });
  }, []); // Empty deps = run once on mount only

  // Show input restore toast when user navigates to home via SPA (only once)
  useEffect(() => {
    if (hasShownInputsToast.current) return;
    if (location.pathname !== '/') return;

    let sessionData = null;
    try {
      sessionData = getSession();
    } catch {
      return;
    }

    if (sessionData?.inputs) {
      setTimeout(() => {
        toast.info('Previous inputs restored.', { timeout: 2500 });
      }, 0);
      hasShownInputsToast.current = true;
    }
  }, [location.pathname]);

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

export default AppSessionManager;
