/**
 * Re-export useAuth from AuthContext
 *
 * This maintains backward compatibility - all existing imports still work.
 * Components continue to import from '@/hooks/useAuth', but now they get
 * the context-based implementation instead of creating duplicate state.
 */

export { useAuth } from '@/contexts/AuthContext';
