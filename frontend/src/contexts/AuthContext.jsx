/**
 * Authentication Context
 *
 * Provides a single shared instance of authentication state across the entire app.
 * This prevents each component from re-initializing auth state when calling useAuth().
 */

import PropTypes from 'prop-types';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { FRONTEND_CONFIG } from '@/config';
import { supabase } from '@/lib/supabase';

const API_URL = FRONTEND_CONFIG.apiBaseUrl;

// Create the context
const AuthContext = createContext(undefined);

/**
 * Fetch user profile from backend API with a timeout (AbortController)
 * - Returns null on timeout / network error / non-OK response
 * @param {string} token - Access token from Supabase session
 * @param {number} timeoutMs - timeout in milliseconds (default 5000)
 * @returns {Promise<Object|null>} User profile data or null
 */
async function fetchUserProfile(token, timeoutMs = 5000) {
  if (!token) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
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
      console.warn('[PROFILE_FETCH_FAILED]', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      console.warn('[PROFILE_FETCH_TIMEOUT]');
    } else {
      console.error('[PROFILE_FETCH_ERROR]', error);
    }
    return null;
  }
}

/**
 * AuthProvider - Wraps the app and provides auth state to all children
 *
 * This ensures auth state is initialized ONCE and shared across all components.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Sign out the current user
   * Clears session and local state
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // State will be cleared by onAuthStateChange listener
    } catch (error) {
      console.error('[SIGN_OUT_ERROR]', error);
    }
  }, []);

  /**
   * Handle authentication state changes
   * Fetches profile when user is authenticated
   */
  const handleAuthChange = useCallback(async (newSession) => {
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

      // Fetch full user profile from backend (includes additional profile data)
      const profileData = await fetchUserProfile(newSession.access_token);
      setProfile(profileData || { username }); // Fallback to metadata username if profile fetch fails

      // After login, do NOT auto-save or mutate persisted session state here.
      // The UI (AppSessionManager) will inspect `session_evaluation_state` and
      // prompt the user when appropriate. Leave persisted session alone.
      // (No-op — kept intentionally concise for readability.)
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
  }, []);

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
            handleAuthChange(data.session).catch((err) =>
              console.warn('[HANDLE_AUTH_CHANGE_ERROR]', err),
            );
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
          }

          // Mark initialization as finished immediately (do not wait for background tasks)
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('[AUTH_INIT_ERROR]', error);
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes. Do NOT block UI by awaiting long-running follow-up work.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        // handleAuthChange will update immediate auth state synchronously and
        // perform follow-ups (profile fetch / pending save) asynchronously.
        handleAuthChange(newSession).catch((err) =>
          console.warn('[HANDLE_AUTH_CHANGE_ERROR]', err),
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
 * useAuth hook - Access shared auth state from context
 *
 * This hook now returns the SAME auth state instance across all components,
 * preventing re-initialization and duplicate loading states.
 *
 * @returns {Object} { user, profile, authLoading, isAuthenticated, session, token, signOut }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  // Return a safe fallback instead of throwing so pages/hooks that can operate
  // without auth (anonymous sessions, tests, isolated renders) don't crash the app.
  // This preserves previous behavior for normal usage while making the hook
  // resilient in environments where the provider is not mounted.
  if (context === undefined) {
    console.warn('useAuth called outside AuthProvider — returning unauthenticated fallback');
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
