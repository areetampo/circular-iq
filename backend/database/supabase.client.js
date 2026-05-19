/**
 * @module supabase.client
 * @description Supabase client factory functions.
 * Creates Supabase clients with appropriate authentication keys for different contexts.
 *
 * Functions:
 * - createSupabaseClient: Client with service role key (backend operations)
 * - createSupabaseAnonClient: Client with anon key (frontend/browser operations)
 */

import { createClient } from '@supabase/supabase-js';

import { BACKEND_CONFIG } from '#config/backend.config.js';

/**
 * Creates a Supabase client with service role key for backend operations.
 * Returns a lightweight stub client if Supabase URL is not configured (for tests).
 *
 * @returns {ReturnType<typeof createClient>} Supabase client instance.
 */
export function createSupabaseClient() {
  if (!BACKEND_CONFIG.supabase.url) {
    logger.warn('Supabase URL not configured — using stub client');
    // Return a lightweight stub client for tests that don't need a real Supabase
    return {
      rpc: async () => ({ data: [], error: null }),
      from: () => ({ select: async () => ({ data: [], error: null }) }),
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    };
  }

  return createClient(BACKEND_CONFIG.supabase.url, BACKEND_CONFIG.supabase.serviceKey);
}

/**
 * Creates a Supabase client with anon key for frontend/browser operations.
 * Returns a lightweight stub client if Supabase URL is not configured (for tests).
 *
 * @returns {ReturnType<typeof createClient>} Supabase client instance.
 */
export function createSupabaseAnonClient() {
  if (!BACKEND_CONFIG.supabase.url) {
    logger.warn('Supabase URL not configured — using stub anon client');
    return {
      rpc: async () => ({ data: [], error: null }),
      from: () => ({ select: async () => ({ data: [], error: null }) }),
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    };
  }

  return createClient(BACKEND_CONFIG.supabase.url, BACKEND_CONFIG.supabase.anonKey);
}
