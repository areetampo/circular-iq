/**
 * useAuth
 * Re-exports the current user and auth actions from AuthContext (single source of truth).
 * @param {Object} options
 * @returns {Object}
 */

import { useAuth } from '@/contexts/AuthContext';

export default useAuth;
