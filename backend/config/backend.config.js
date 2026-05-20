/**
 * @module backend.config
 * @description Central configuration loader and validator for the backend application.
 * Loads and validates environment variables via Zod schemas, freezes configuration
 * immutably to prevent runtime changes, and supports strict mode for CI/CD environments.
 *
 * Environment sources (in order of precedence):
 * 1. env/.env.{NODE_ENV} (loaded by loadEnv.js)
 * 2. env/.env.local (if exists, for development overrides)
 * 3. Process environment variables
 *
 * Exports BACKEND_CONFIG object with sections:
 * - nodeEnv: NODE_ENV string
 * - isProduction: Boolean flag
 * - app: Server settings (port, CORS, API keys, rate limits)
 * - database: PostgreSQL/Supabase connection details
 * - openai: OpenAI API configuration
 * - aiven: Optional Aiven PostgreSQL pool details
 * - uptime: Uptime monitoring configuration
 * - scoring: Scoring and database function configuration
 */

import '#config/loadEnv.js';

import pino from 'pino';

import { envSchema, testEnvSchema } from '#config/env.schema.js';
import { API_ENDPOINTS, HEALTH_ENDPOINTS } from '#constants/index.js';

const logger = pino({
  name: 'backend.config',
  level: process.env.LOG_LEVEL || 'info',
});

/* ------------------------------ */
/* Test-friendly defaults */
/* ------------------------------ */
// For tests, no defaults; must be in .env.test
// Removed test defaults to enforce strict env loading

/* ------------------------------ */
/* Snapshot + Validation */
/* ------------------------------ */

const schema = (process.env.NODE_ENV || '').toLowerCase() === 'test' ? testEnvSchema : envSchema;
const rawEnv = { ...process.env };
const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  logger.error(
    { error: parsed.error.format() },
    '✕ Environment validation failed, check your environment variables configuration',
  );

  const isTestEnv = (process.env.NODE_ENV || '').toLowerCase() === 'test';

  if (isTestEnv) {
    logger.error(
      '✕ Test environment validation failed, ensure all required variables are set in env/.env.test',
    );
  } else {
    logger.error('✕ Environment validation failed, check your environment variables configuration');
  }

  process.exit(1);
}

const env = Object.freeze({ ...parsed.data });

/* ------------------------------ */
/* Strict CI Enforcement */
/* ------------------------------ */

if (env.STRICT_ENV) {
  const missingExplicit = Object.entries(parsed.data)
    .filter(([key]) => !(key in rawEnv) || rawEnv[key] === undefined)
    .map(([key]) => key);

  if (missingExplicit.length > 0) {
    logger.error({ missingExplicit }, '✕ STRICT_ENV enabled and missing explicit values');
    process.exit(1);
  }
}

/* ------------------------------ */
/* Deep Freeze */
/* ------------------------------ */

/**
 * Recursively freezes an object and all its nested properties to prevent runtime modifications.
 * @param {Object} obj - The object to deeply freeze.
 * @returns {Object} The frozen object (same reference, now immutable).
 */
const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

/* ------------------------------ */
/* Config Object */
/* ------------------------------ */

const isProduction = env.NODE_ENV === 'production';

/**
 * List of database function names used in the application. This centralizes the function names, making it easier to manage and refactor database interactions. The actual function names in the database are expected to match these, but if we need to change them, we can do so here without affecting the rest of the codebase.
 * @type {string[]}
 * @private
 */
const DB_FUNCTIONS = Object.freeze([
  'match_documents',
  'search_documents_by_industry',
  'search_documents_by_category',
  'search_documents_hybrid',
  'search_documents_hybrid_filtered',
  'find_recent_documents',
  'get_document_statistics',
  'count_documents_by_category',
  'truncate_documents',
  'update_updated_at_column',
  'safe_jsonb_cast',
  'backfill_document_metadata',
]);

/**
 * Returns database configuration with table and function names.
 * This abstracts the actual table/function names from the rest of the code,
 * allowing for easier refactoring and potential multi-database support in the future.
 * The function names and table names are expected to be the same in both Supabase and Aiven setups,
 * but this layer of abstraction allows us to change them in one place if needed.
 * @returns {Object} Database configuration with tables and functions.
 * @private
 */
const buildDatabaseConfig = () => ({
  tables: { documents: 'documents' },
  functions: {
    ...Object.fromEntries(DB_FUNCTIONS.map((n) => [n, n])),
    // Ensure all hybrid searches use the full result set (including industry/category/source)
    // even when callers originally used the filtered variant.
    search_documents_hybrid_filtered: 'search_documents_hybrid',
  },
});

/**
 * Parses and deduplicates allowed CORS origins from environment variables.
 * Combines explicitly allowed origins with the frontend app URL.
 * @returns {Array<string>} Deduplicated array of allowed origin URLs.
 */
const parseAllowedOrigins = () => {
  const origins = env.ALLOWED_ORIGINS ?? [];
  const frontend = env.APP_URL ? [env.APP_URL] : [];

  return [...new Set([...origins, ...frontend])];
};

export const BACKEND_CONFIG = deepFreeze({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProduction,

  testCredentials: {
    username: env.TEST_USER_NAME,
    usernameExt: env.TEST_USER_NAME_EXT,
    password: env.TEST_USER_PASSWORD,
  },

  api: API_ENDPOINTS,

  openai: {
    apiKey: env.OPENAI_API_KEY,
  },

  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    host: env.SUPABASE_HOST,
    port: env.SUPABASE_PORT,
    database: env.SUPABASE_DATABASE,
    user: env.SUPABASE_USER,
    password: env.SUPABASE_PASSWORD,
    connectionLimit: env.SUPABASE_CONNECTION_LIMIT,
    connectionString: env.SUPABASE_CONNECTION_STRING,
    idleTimeoutMs: env.SUPABASE_IDLE_TIMEOUT_MS,
  },

  aiven: {
    host: env.AIVEN_HOST,
    port: env.AIVEN_PORT,
    database: env.AIVEN_DATABASE,
    user: env.AIVEN_USER,
    password: env.AIVEN_PASSWORD,
    ssl: env.AIVEN_SSL_MODE !== 'disable',
    sslMode: env.AIVEN_SSL_MODE,
    connectionLimit: env.AIVEN_CONNECTION_LIMIT,
    connectionString: env.AIVEN_CONNECTION_STRING,
    idleTimeoutMs: env.AIVEN_IDLE_TIMEOUT_MS,
    sslCA: env.AIVEN_CA_CERT,
  },

  scoring: {
    db: buildDatabaseConfig(),
    useSupabaseDocuments: env.USE_SUPABASE_DOCUMENTS_TABLE,
    anonScoringLimit: env.ANON_SCORING_LIMIT,
  },

  app: {
    appUrl: env.APP_URL,
    apiUrl: env.API_URL,

    allowedOrigins: parseAllowedOrigins(),

    logLevel: env.LOG_LEVEL,

    apiAuthEnabled: env.API_AUTH_ENABLED,
    apiKey: env.API_KEY,
    strictEnv: env.STRICT_ENV,
  },

  uptime: {
    pollingEnabled: isProduction, // Only run polling and cleanup in production to avoid duplicate data during development
    pollIntervalMs: env.UPTIME_CHECKS_POLL_INTERVAL_MS, // 2 min
    maxHistoryPerEndpoint: env.UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT, // 2min interval -> 30/hr * 24h * 28d = 20160 max checks per endpoint -> 30d = 21600 chosen as sufficient
    queryWindowDaysLimit: env.UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT, // 28 days
    retentionDays: env.UPTIME_CHECKS_RETENTION_DAYS, // 30 days
    cleanupOnStart: env.UPTIME_CHECKS_CLEANUP_ON_START, // Set to true to truncate the entire table on server start
    cleanupIntervalDurationMs: env.UPTIME_CHECKS_CLEANUP_INTERVAL_MS, // 24 hours
    endpoints: HEALTH_ENDPOINTS.map((endpoint) => endpoint.path),
  },
});
