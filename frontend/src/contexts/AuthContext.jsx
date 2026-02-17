/**
 * Authentication Context
 *
 * Provides a single shared instance of authentication state across the entire app.
 * This prevents each component from re-initializing auth state when calling useAuth().
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { supabase } from '@/lib/supabase';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { createAssessment } from '@/features/assessments/api/assessmentApi';
import { clearAnonymousSession } from '@/utils/session';

const API_URL = SITE_CONFIG.apiBaseUrl;

// Create the context
const AuthContext = createContext(undefined);

/**
 * Fetch user profile from backend API
 * @param {string} token - Access token from Supabase session
 * @returns {Promise<Object|null>} User profile data or null
 */
async function fetchUserProfile(token) {
  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.warn('[PROFILE_FETCH_FAILED]', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[PROFILE_FETCH_ERROR]', error);
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
  const navigate = useNavigate();

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

      // After login, check for any pending anonymous save that should be migrated
      try {
        const pendingStr = localStorage.getItem('ce_pending_save');
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          if (pending?.needsSave && pending?.results) {
            // Prepare payload for backend create
            const savePayload = {
              name: `Assessment ${new Date().toLocaleDateString()}`,
              result_json: pending.results,
              businessProblem: pending.inputs?.businessProblem || '',
              businessSolution: pending.inputs?.businessSolution || '',
              parameters: pending.inputs?.parameters || undefined,
            };

            try {
              const saved = await createAssessment(savePayload);
              const newId = saved?.id || saved?.assessment?.id;

              // Clear pending save from localStorage
              localStorage.removeItem('ce_pending_save');

              // Clear anonymous session after successful save
              try {
                clearAnonymousSession();
              } catch (e) {
                console.warn('Failed to clear anonymous session after save:', e);
              }

              // Navigate to saved assessment
              if (newId) navigate(`/assessments/${newId}`);
            } catch (err) {
              console.error('Failed to create assessment from pending save:', err);
              // On error, keep the pending save for retry
            }
          }
        }
      } catch (e) {
        console.warn('Post-login pending save failed:', e);
      }
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
        // Get the current session
        const { data } = await supabase.auth.getSession();

        if (isMounted) {
          if (data?.session) {
            await handleAuthChange(data.session);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
          }
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

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (isMounted) {
        await handleAuthChange(newSession);
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

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
