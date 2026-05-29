/**
 * Supabase auth state shared through `AuthProvider` and consumed with `useAuth`.
 * Initializes the current session, fetches profile data with a timeout, and separates anonymous evaluation storage on login/logout.
 */

import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { FRONTEND_CONFIG } from '@/config/frontend.config';
import { clearEvaluationInputs, clearEvaluationState } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/utils/session';

// Create the context
const AuthContext = createContext(undefined);

/**
 * Fetches `/api/profile` with AbortController timeout; returns null on failure or 404.
 *
 * @param {string} token - Supabase access token used for the profile request.
 * @param {number} [timeoutMs=5000] - Abort timeout for the profile endpoint.
 * @returns {Promise<Object|null>} Parsed profile JSON, or null when missing, not found, timed out, or unavailable.
 */
async function fetchUserProfile(token, timeoutMs = 5000) {
  if (!token) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${FRONTEND_CONFIG.app.apiUrl}/api/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      if (response.status === 404) return null;
      logger.warn('[PROFILE_FETCH_FAILED]', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      logger.warn('[PROFILE_FETCH_TIMEOUT]');
    } else {
      logger.error('[PROFILE_FETCH_ERROR]', error);
    }
    return null;
  }
}

/**
 * Provides Supabase auth state to the React tree and separates anonymous
 * evaluation state from authenticated sessions on login/logout.
 *
 * @example
 * const { user, isAuthenticated, signOut } = useAuth();
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false); // Track if initial auth check is done

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // State will be cleared by onAuthStateChange listener
    } catch (error) {
      logger.error('[SIGN_OUT_ERROR]', error);
    }
  }, []);

  const handleAuthChange = useCallback(
    async (newSession) => {
      const wasAuthenticated = isAuthenticated;
      const isNowAuthenticated = !!newSession;

      // Determine if this is an actual auth event (not initialization)
      const isAuthEvent = hasInitialized;

      if (newSession) {
        setSession(newSession);

        // Extract username from user_metadata for immediate UI update
        const username = newSession.user?.user_metadata?.username || null;
        const userWithUsername = {
          ...newSession.user,
          username, // Add username directly to user object
        };

        setUser(userWithUsername);
        setIsAuthenticated(true);

        // Only clear session state on actual login event (not page reload/session restoration)
        if (isAuthEvent && !wasAuthenticated) {
          try {
            const cleared = clearEvaluationInputs();
            logger.info('[SESSION_STATE_CLEARED_ON_LOGIN]', {
              cleared,
              userId: newSession.user.id,
              wasAuthenticated,
              isNowAuthenticated,
              isAuthEvent,
            });
          } catch (error) {
            logger.warn('[SESSION_STATE_CLEAR_FAILED_ON_LOGIN]', error);
          }

          // Renew session_id when user logs in to separate anonymous and authenticated sessions
          try {
            const oldSessionId = localStorage.getItem('session_id');
            const newSessionId = getSessionId(true); // Force renewal
            logger.info('[SESSION_ID_RENEWED]', {
              oldSessionId,
              newSessionId,
              userId: newSession.user.id,
              wasAuthenticated,
              isNowAuthenticated,
              isAuthEvent,
            });
          } catch (error) {
            logger.warn('[SESSION_ID_RENEWAL_FAILED]', error);
          }
        } else {
          // Session restoration - don't clear anything
          logger.info('[SESSION_RESTORED]', {
            userId: newSession.user.id,
            wasAuthenticated,
            isNowAuthenticated,
            isAuthEvent,
          });
        }

        // Fetch full user profile from backend (includes additional profile data)
        const profileData = await fetchUserProfile(newSession.access_token);
        setProfile(profileData || { username }); // Fallback to metadata username if profile fetch fails

        // After login, do NOT auto-save or mutate persisted session state here.
        // The UI (AppSessionManager) will inspect `session_evaluation_state` and
        // prompt the user when appropriate. Leave persisted session alone.
        // (No-op - kept intentionally concise for readability.)
      } else {
        // Only clear session state on actual logout event (not initialization)
        if (isAuthEvent && wasAuthenticated) {
          try {
            const cleared = clearEvaluationState();
            logger.info('[SESSION_STATE_CLEARED_ON_LOGOUT]', {
              cleared,
              wasAuthenticated,
              isNowAuthenticated,
              isAuthEvent,
            });
          } catch (error) {
            logger.warn('[SESSION_STATE_CLEAR_FAILED_ON_LOGOUT]', error);
          }
        } else {
          // Initial state or non-auth event
          logger.info('[SESSION_CLEARED_ON_INIT]', {
            wasAuthenticated,
            isNowAuthenticated,
            isAuthEvent,
          });
        }

        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    },
    [isAuthenticated, hasInitialized],
  );

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Get the current session (quick check)
        const { data } = await supabase.auth.getSession();

        if (isMounted) {
          if (data?.session) {
            // Run the heavier work *in the background* so initAuth doesn't block the UI.
            // handleAuthChange updates immediate user/session state synchronously,
            // but it also performs longer-running tasks (profile fetch, pending save).
            // Calling without await prevents the initial "Authenticating..." stall.
            handleAuthChange(data.session).catch((error) =>
              logger.warn('[HANDLE_AUTH_CHANGE_ERROR]', error),
            );
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
          }

          // Mark initialization as finished immediately (do not wait for background tasks)
          setAuthLoading(false);
          setHasInitialized(true);
        }
      } catch (error) {
        logger.error('[AUTH_INIT_ERROR]', error);
        if (isMounted) {
          setAuthLoading(false);
          setHasInitialized(true);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes. Do NOT block UI by awaiting long-running follow-up work.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        // handleAuthChange will update immediate auth state synchronously and
        // perform follow-ups (profile fetch / pending save) asynchronously.
        handleAuthChange(newSession).catch((error) =>
          logger.warn('[HANDLE_AUTH_CHANGE_ERROR]', error),
        );
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [handleAuthChange]);

  const value = {
    user,
    profile,
    session,
    authLoading,
    isAuthenticated,
    token: session?.access_token || null,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Consumes auth state from `AuthProvider`. Outside the provider, logs a warning and returns an unauthenticated fallback (no throw).
 *
 * @returns {{
 *   user: Object|null,
 *   profile: Object|null,
 *   session: Object|null,
 *   authLoading: boolean,
 *   isAuthenticated: boolean,
 *   token: string|null,
 *   signOut: () => Promise<void>
 * }} Current auth state plus sign-out action, or unauthenticated fallback outside the provider.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  // Return a safe fallback instead of throwing so pages/hooks that can operate
  // without auth (anonymous sessions, tests, isolated renders) don't crash the app.
  // This preserves previous behavior for normal usage while making the hook
  // resilient in environments where the provider is not mounted.
  if (context === undefined) {
    logger.warn(
      '[AUTH_CONTEXT:USE_AUTH_OUTSIDE_PROVIDER]',
      'useAuth was called outside of AuthProvider. Returning unauthenticated fallback.',
    );
    return {
      user: null,
      profile: null,
      session: null,
      authLoading: false,
      isAuthenticated: false,
      token: null,
      signOut: async () => {},
    };
  }

  return context;
}
