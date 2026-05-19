/**
 * @module database.client
 * @description Database client factory and connection pool management.
 * Provides singleton instances of Supabase clients and PostgreSQL connection pools
 * for both Supabase and Aiven databases. Supports test overrides for mocking.
 *
 * Key functions:
 * - getSupabaseClient: Returns singleton Supabase client (service role)
 * - getSupabasePgPool: Returns PostgreSQL pool for Supabase
 * - getAivenPgPool: Returns PostgreSQL pool for Aiven
 * - getDatabaseClient: Unified accessor based on configuration
 * - setDatabaseClientOverride: Override for testing
 * - closeAllPools: Cleanup function for test teardown
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
 * Sets a custom database client override for testing or special cases.
 * The type string influences SQL vs RPC behavior in repositories.
 *
 * @param {Object} client - Custom database client (e.g., mocked Supabase object).
 * @param {string} [type='supabase'] - Client type: 'supabase' or 'postgres'.
 */
export function setDatabaseClientOverride(client, type = 'supabase') {
  _overrideClient = client;
  _overrideType = type;
}

/**
 * Returns a singleton Supabase client with service role key.
 * Lazily initializes the client on first call.
 *
 * @returns {Object} Supabase client instance.
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
 * Creates or returns an existing PostgreSQL connection pool for Aiven.
 * The pool is lazily instantiated and reused across calls.
 * Supports SSL with CA certificate for secure connections.
 *
 * @returns {Pool} PostgreSQL connection pool instance.
 */
export function getAivenPgPool() {
  if (!_aivenPgPool) {
    const startTime = Date.now();

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
 * Creates or returns an existing PostgreSQL connection pool for Supabase.
 * The pool is lazily instantiated and reused across calls.
 *
 * @returns {Pool} PostgreSQL connection pool instance.
 */
export function getSupabasePgPool() {
  if (!_supabasePgPool) {
    const startTime = Date.now();

    const cfg = BACKEND_CONFIG.supabase;

    _supabasePgPool = new Pool({
      connectionString: cfg.connectionString,
      ssl: { rejectUnauthorized: false },
      max: cfg.connectionLimit,
      idleTimeoutMillis: 30000,
    });

    logger.logOperation('getSupabasePgPool', 'db/pool-init', 'success', Date.now() - startTime, {
      clientType: 'supabase-pool',
      maxConnections: cfg.connectionLimit,
    });
  }

  return _supabasePgPool;
}

/**
 * Returns the appropriate database client based on configuration or override.
 * Respects test overrides and the useSupabaseDocuments configuration flag.
 *
 * @returns {Object} Database client (Supabase client or PostgreSQL pool).
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
 * Returns the effective database type for the current client.
 * Used by repositories to distinguish between Supabase and PostgreSQL behaviors.
 *
 * @returns {string} Database type: 'supabase' or 'postgres'.
 */
export function getDatabaseType() {
  if (_overrideClient) return _overrideType || 'supabase';
  return BACKEND_CONFIG.scoring.useSupabaseDocuments ? 'supabase' : 'postgres';
}

/**
 * Closes all database connections and pools.
 * Used in test cleanup to prevent open handles from hanging the test runner.
 * Includes a 3-second timeout for graceful shutdown.
 *
 * @returns {Promise<void>} Resolves when all pools are closed or timeout expires.
 */
export async function closeAllPools() {
  logger.info('🔌 Closing all database connections...');
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
      logger.info('✓ Database connections closed');
    } catch (err) {
      logger.warn({ err }, '⚠️ Database close timeout/error');
    }
  } else {
    logger.info('✓ No database connections to close');
  }
}
