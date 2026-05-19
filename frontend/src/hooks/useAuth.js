/**
 * @module useAuth
 * @description Custom hook for authentication state and actions.
 * Re-exports the current user and auth actions from AuthContext (single source of truth).
 *
 * @returns {{
 *   user: Object|null,
 *   profile: Object|null,
 *   session: Object|null,
 *   authLoading: boolean,
 *   isAuthenticated: boolean,
 *   hasInitialized: boolean,
 *   signIn: (username: string, password: string) => Promise<{error: Error|null}>,
 *   signUp: (username: string, password: string) => Promise<{error: Error|null}>,
 *   signOut: () => Promise<void>
 * }}
 */

import { useAuth } from '@/contexts/AuthContext';

export default useAuth;
