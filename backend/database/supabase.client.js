/**
 * Supabase client factories (service role and anon). Returns stub clients when URL is unset (tests).
 */

import { createClient } from '@supabase/supabase-js';

import { BACKEND_CONFIG } from '#config/backend.config.js';

/**
 * Creates the service-role Supabase client used by backend repositories and auth checks.
 * When the URL is absent, tests receive a minimal stub with `rpc`, `from().select`, and
 * `auth.getUser` methods so code paths can run without network configuration.
 *
 * @returns {ReturnType<typeof createClient>|{ rpc: () => Promise<{data: unknown[], error: null}>, from: () => {select: () => Promise<{data: unknown[], error: null}>}, auth: {getUser: () => Promise<{data: {user: null}, error: null}>} }} Real Supabase service client or offline test stub.
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
 * Creates an anon-key Supabase client for browser-style operations that do not need service role.
 * Missing URL configuration returns the same offline stub shape as the service client factory.
 *
 * @returns {ReturnType<typeof createClient>|{ rpc: () => Promise<{data: unknown[], error: null}>, from: () => {select: () => Promise<{data: unknown[], error: null}>}, auth: {getUser: () => Promise<{data: {user: null}, error: null}>} }} Real Supabase anon client or offline test stub.
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
