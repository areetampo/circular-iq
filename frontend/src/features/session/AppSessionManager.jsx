import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSession } from '@/utils/session';
import { useGlobalDialog } from '@/contexts/DialogContext';
import DIALOGS from '@/components/dialogs/dialogTypes';
import { useAuth } from '@/hooks/useAuth';

/**
 * Global session manager that shows restore prompt ONLY on page load/refresh
 * NOT on SPA navigation
 */
export function AppSessionManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSessionRestoreDialog, dialog } = useGlobalDialog();
  const { isAuthenticated } = useAuth();
  const hasCheckedOnLoad = useRef(false);

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
      console.error('Failed to read session:', e);
      hasCheckedOnLoad.current = true;
      return;
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

    // Show restore dialog (only for sessions that include results)
    openSessionRestoreDialog({
      sessionData: sessionData,
      onDismiss: () => {
        // User dismissed - do nothing
      },
    });
  }, []); // Empty deps = run once on mount only

  // Post-login automatic save prompt intentionally disabled.
  // Users must explicitly click the Save button on the Results page to save.
  // This avoids intrusive modal prompts immediately after sign-in.
  // (No-op; handled by ResultsPage when user manually clicks Save.)

  return null;
}

export default AppSessionManager;
