/**
 * Singleton Supabase client and Postgres pools (Supabase + Aiven).
 * `setDatabaseClientOverride` swaps the client used by repositories in tests.
 */

import { Pool } from 'pg';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { createSupabaseClient } from '#database/supabase.client.js';

let _supabaseClient = null;
let _supabasePgPool = null;
let _aivenPgPool = null;

// override for testing / special cases
let _overrideClient = null;
let _overrideType = null;

/**
 * Overrides the repository database client until the process resets or another override is set.
 * Tests use this to inject mock Supabase clients or pg pools without touching runtime config.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient|Pool|Record<string, unknown>|null} client - Custom database client, or `null` to clear the override.
 * @param {'supabase'|'postgres'} [type='supabase'] - Client behavior mode used by repository branching.
 */
export function setDatabaseClientOverride(client, type = 'supabase') {
  _overrideClient = client;
  _overrideType = type;
}

/**
 * Returns the singleton service-role Supabase client, creating it on first access.
 * Initialization is logged once so startup diagnostics show which client path repositories use.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient|Record<string, unknown>} Service-role Supabase client or offline stub from `createSupabaseClient`.
 */
export function getSupabaseClient() {
  if (!_supabaseClient) {
    const startTime = Date.now();

    _supabaseClient = createSupabaseClient();

    logger.logOperation('getSupabaseClient', 'db/client-init', 'success', Date.now() - startTime, {
      clientType: 'supabase',
    });
  }
  return _supabaseClient;
}

/**
 * Returns the singleton Aiven PostgreSQL pool, creating it with SSL settings from config.
 * CA-based SSL takes precedence over connection-string setup so hostname verification works.
 *
 * @returns {Pool} Reused Aiven PostgreSQL connection pool.
 */
export function getAivenPgPool() {
  if (!_aivenPgPool) {
    const startTime = Date.now();

    const cfg = BACKEND_CONFIG.aiven;
    const poolOptions = {
      max: cfg.connectionLimit,
      idleTimeoutMillis: cfg.idleTimeoutMs,
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

    logger.logOperation('getAivenPgPool', 'db/pool-init', 'success', Date.now() - startTime, {
      clientType: 'aiven',
      maxConnections: cfg.connectionLimit,
      host: cfg.host,
      database: cfg.database,
    });
  }
  return _aivenPgPool;
}

/**
 * Returns the singleton Supabase PostgreSQL pool used for raw SQL paths that the JS client cannot express.
 *
 * @returns {Pool} Reused Supabase PostgreSQL connection pool.
 */
export function getSupabasePgPool() {
  if (!_supabasePgPool) {
    const startTime = Date.now();

    const cfg = BACKEND_CONFIG.supabase;

    _supabasePgPool = new Pool({
      connectionString: cfg.connectionString,
      ssl: { rejectUnauthorized: false },
      max: cfg.connectionLimit,
      idleTimeoutMillis: cfg.idleTimeoutMs,
    });

    logger.logOperation('getSupabasePgPool', 'db/pool-init', 'success', Date.now() - startTime, {
      clientType: 'supabase-pool',
      maxConnections: cfg.connectionLimit,
    });
  }

  return _supabasePgPool;
}

/**
 * Resolves the active repository database client.
 * Explicit overrides win first; otherwise config chooses Supabase JS for document-table mode or
 * the Aiven pg pool for direct PostgreSQL mode.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient|Pool|Record<string, unknown>} Active repository client, honoring test overrides before configuration.
 */
export function getDatabaseClient() {
  if (_overrideClient) {
    return _overrideClient;
  }

  if (BACKEND_CONFIG.scoring.useSupabaseDocuments) {
    return getSupabaseClient();
  }
  // For Postgres we return the pool itself; callers will use pool.query
  return getAivenPgPool();
}

/**
 * Reports the behavior mode repositories should use for the current database client.
 * Overrides may force either Supabase RPC behavior or raw PostgreSQL behavior.
 *
 * @returns {'supabase'|'postgres'} Effective database type for repository branching.
 */
export function getDatabaseType() {
  if (_overrideClient) return _overrideType || 'supabase';
  return BACKEND_CONFIG.scoring.useSupabaseDocuments ? 'supabase' : 'postgres';
}

/**
 * Closes initialized pg pools and clears cached database clients during shutdown or tests.
 * Pool shutdown is bounded by a 3-second timeout so test cleanup cannot hang forever.
 */
export async function closeAllPools() {
  logger.info('🔌 Closing all database connections...');
  const promises = [];

  if (_aivenPgPool) {
    promises.push(
      _aivenPgPool.end().catch((error) => {
        logger.error({ error }, 'Error closing Aiven pool');
        return null; // Don't fail the cleanup
      }),
    );
    _aivenPgPool = null;
  }

  if (_supabasePgPool) {
    promises.push(
      _supabasePgPool.end().catch((error) => {
        logger.error({ error }, 'Error closing Supabase pool');
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
      logger.info('✓ Database connections closed');
    } catch (error) {
      logger.warn({ error }, '⚠️ Database close timeout/error');
    }
  } else {
    logger.info('✓ No database connections to close');
  }
}
