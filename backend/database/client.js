import { Pool } from 'pg';
import { createSupabaseClient } from '#database/supabase.client.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

let _supabaseClient = null;
let _pgPool = null;

// override for testing / special cases
let _overrideClient = null;
let _overrideType = null;

/**
 * For tests or other consumers that need to supply a custom client (e.g. the
 * mocked Supabase object used by the unit tests). The `type` string should be
 * either `'supabase'` or `'postgres'` to influence SQL vs RPC behavior.
 */
export function setDatabaseClientOverride(client, type = 'supabase') {
  _overrideClient = client;
  _overrideType = type;
}

/**
 * Return a singleton Supabase client (service role key).
 */
export function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = createSupabaseClient();
  }
  return _supabaseClient;
}

/**
 * Create or return an existing Postgres pool pointed at the Aiven instance.
 * The pool is lazily instantiated and reused.
 */
export function getPgPool() {
  if (!_pgPool) {
    const cfg = BACKEND_CONFIG.aiven;
    const poolOptions = {
      ssl: cfg.ssl ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' } : false,
      max: cfg.connectionLimit,
      idleTimeoutMillis: 30000,
    };

    // If a full connection string is provided, prefer it over individual fields
    if (cfg.connectionString) {
      poolOptions.connectionString = cfg.connectionString;
    } else {
      poolOptions.host = cfg.host;
      poolOptions.port = cfg.port;
      poolOptions.database = cfg.database;
      poolOptions.user = cfg.user;
      poolOptions.password = cfg.password;
    }

    _pgPool = new Pool(poolOptions);
  }
  return _pgPool;
}

/**
 * Unified accessor that returns whichever client is appropriate based on
 * configuration or override.
 */
export function getDatabaseClient() {
  if (_overrideClient) {
    return _overrideClient;
  }

  if (BACKEND_CONFIG.useSupabaseDocuments) {
    return getSupabaseClient();
  }
  // For Postgres we return the pool itself; callers will use pool.query
  return getPgPool();
}

/**
 * Returns the effective database type for the current client. Used by the
 * repository to distinguish between supabase and postgres behaviors when an
 * override is present.
 */
export function getDatabaseType() {
  if (_overrideClient) return _overrideType || 'supabase';
  return BACKEND_CONFIG.useSupabaseDocuments ? 'supabase' : 'postgres';
}
