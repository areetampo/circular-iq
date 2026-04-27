import { Pool } from 'pg';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { createSupabaseClient } from '#database/supabase.client.js';
import { logger } from '#utils/logger.js';

let _supabaseClient = null;
let _supabasePgPool = null;
let _aivenPgPool = null;

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
export function getAivenPgPool() {
  if (!_aivenPgPool) {
    const cfg = BACKEND_CONFIG.aiven;
    const poolOptions = {
      max: cfg.connectionLimit,
      idleTimeoutMillis: 30000,
    };

    if (cfg.sslCA) {
      // Use individual parameters and SSL with CA
      poolOptions.host = cfg.host;
      poolOptions.port = cfg.port;
      poolOptions.database = cfg.database;
      poolOptions.user = cfg.user;
      poolOptions.password = cfg.password;
      poolOptions.ssl = {
        ca: cfg.sslCA, // the PEM certificate
        rejectUnauthorized: true,
        servername: cfg.host, // critical for SNI and hostname verification
      };
    } else if (cfg.connectionString) {
      poolOptions.connectionString = cfg.connectionString;
    } else {
      poolOptions.host = cfg.host;
      poolOptions.port = cfg.port;
      poolOptions.database = cfg.database;
      poolOptions.user = cfg.user;
      poolOptions.password = cfg.password;
    }

    _aivenPgPool = new Pool(poolOptions);
  }
  return _aivenPgPool;
}

/**
 *
 */
export function getSupabasePgPool() {
  if (!_supabasePgPool) {
    const cfg = BACKEND_CONFIG.supabase;

    _supabasePgPool = new Pool({
      connectionString: cfg.connectionString,
      ssl: { rejectUnauthorized: false },
      max: cfg.connectionLimit,
      idleTimeoutMillis: 30000,
    });
  }

  return _supabasePgPool;
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
  return getAivenPgPool();
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

/**
 * Close all database connections and pools. Used in test cleanup.
 * This prevents open handles from hanging the test runner.
 */
export async function closeAllPools() {
  logger.log('🔌 Closing all database connections...');
  const promises = [];

  if (_aivenPgPool) {
    promises.push(
      _aivenPgPool.end().catch((err) => {
        logger.error({ err }, 'Error closing Aiven pool');
        return null; // Don't fail the cleanup
      }),
    );
    _aivenPgPool = null;
  }

  if (_supabasePgPool) {
    promises.push(
      _supabasePgPool.end().catch((err) => {
        logger.error({ err }, 'Error closing Supabase pool');
        return null; // Don't fail the cleanup
      }),
    );
    _supabasePgPool = null;
  }

  // Supabase client doesn't have a close method, just clear the reference
  _supabaseClient = null;

  // Force close with timeout
  if (promises.length > 0) {
    try {
      await Promise.race([
        Promise.allSettled(promises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database close timeout')), 3000),
        ),
      ]);
      logger.log('✅ Database connections closed');
    } catch (err) {
      logger.warn({ err }, '⚠️ Database close timeout/error');
    }
  } else {
    logger.log('✅ No database connections to close');
  }
}
