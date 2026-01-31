/**
 * Authentication Hook
 *
 * Provides current user authentication state and session token.
 * Listens to Supabase auth state changes.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useAuth hook - Get current user and session
 *
 * @returns {Object} { user, isLoading, isAuthenticated, session, token }
 *
 * @example
 * const { user, isAuthenticated, token } = useAuth();
 * if (!isAuthenticated) return <LoginPage />;
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Get the current session
        const { data } = await supabase.auth.getSession();

        if (isMounted) {
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
            setIsAuthenticated(true);
          } else {
            setSession(null);
            setUser(null);
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
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
        } else {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    token: session?.access_token || null,
  };
}
