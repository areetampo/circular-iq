import { createClient } from '@supabase/supabase-js';

import { BACKEND_CONFIG } from '#config/backend.config.js';

/**
 * Create a Supabase client with service role key (for backend operations)
 * @returns {ReturnType<typeof createClient>}
 */
export function createSupabaseClient() {
  if (!BACKEND_CONFIG.supabase.url) {
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
 * Create a Supabase client with anon key (for frontend/browser operations)
 * @returns {ReturnType<typeof createClient>}
 */
export function createSupabaseAnonClient() {
  if (!BACKEND_CONFIG.supabase.url) {
    return {
      rpc: async () => ({ data: [], error: null }),
      from: () => ({ select: async () => ({ data: [], error: null }) }),
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    };
  }

  return createClient(BACKEND_CONFIG.supabase.url, BACKEND_CONFIG.supabase.anonKey);
}
