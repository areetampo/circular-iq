/**
 * Authentication Hook
 *
 * Provides current user authentication state, session token, and profile data.
 * Listens to Supabase auth state changes and fetches user profile from backend.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch user profile from backend API
 * @param {string} token - Access token from Supabase session
 * @returns {Promise<Object|null>} User profile data or null
 */
async function fetchUserProfile(token) {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[PROFILE_NOT_FOUND] Profile does not exist yet');
        return null;
      }
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[PROFILE_FETCH_ERROR]', error);
    return null;
  }
}

/**
 * useAuth hook - Get current user, session, and profile data
 *
 * @returns {Object} { user, profile, isLoading, isAuthenticated, session, token, signOut }
 *
 * Features:
 * - Listens to Supabase auth state changes
 * - Fetches user profile (username) from backend when authenticated
 * - Provides signOut function to log out users
 * - Manages loading states during initialization
 *
 * @example
 * const { user, profile, isAuthenticated, signOut } = useAuth();
 * if (!isAuthenticated) return <LoginPage />;
 * return <div>Welcome, {profile?.username}!</div>;
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AUTH_INIT_ERROR]', error);
        if (isMounted) {
          setIsLoading(false);
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

  return {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    token: session?.access_token || null,
    signOut,
  };
}
