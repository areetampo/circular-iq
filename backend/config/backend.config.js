/**
 * Validates env via Zod, builds frozen `BACKEND_CONFIG`, and exits on failure.
 * `STRICT_ENV` rejects schema defaults so CI can prove every runtime key is explicitly supplied.
 */

import '#config/loadEnv.js';

import pino from 'pino';

import { envSchema, testEnvSchema } from '#config/env.schema.js';
import { API_ENDPOINTS, HEALTH_ENDPOINTS } from '#constants/index.js';

const logger = pino({
  name: 'backend.config',
  level: process.env.LOG_LEVEL || 'info',
});

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

if (env.STRICT_ENV) {
  const missingExplicit = Object.entries(parsed.data)
    .filter(([key]) => !(key in rawEnv) || rawEnv[key] === undefined)
    .map(([key]) => key);

  if (missingExplicit.length > 0) {
    logger.error({ missingExplicit }, '✕ STRICT_ENV enabled and missing explicit values');
    process.exit(1);
  }
}

/**
 * Recursively freezes the validated config object so runtime modules cannot mutate shared settings.
 *
 * @template {Record<string, unknown>} T
 * @param {T} obj - Configuration object or nested branch to recursively freeze.
 * @returns {T} The same object reference after recursively freezing nested plain objects.
 */
const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

const isProduction = env.NODE_ENV === 'production';

/** Postgres RPC names exposed on `BACKEND_CONFIG.scoring.db.functions`. */
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
 * Builds table and RPC identifiers consumed by repositories.
 *
 * @returns {{
 *   tables: { documents: string },
 *   functions: Record<string, string>
 * }} Table aliases and Postgres RPC names, with filtered hybrid search routed to full hybrid results.
 */
const buildDatabaseConfig = () => ({
  tables: { documents: 'documents' },
  functions: {
    ...Object.fromEntries(DB_FUNCTIONS.map((n) => [n, n])),
    // Repositories expect metadata-rich rows even when using the legacy filtered RPC alias.
    search_documents_hybrid_filtered: 'search_documents_hybrid',
  },
});

/**
 * Builds the CORS allowlist used by the Express app.
 *
 * @returns {string[]} Unique origins from `ALLOWED_ORIGINS` plus `APP_URL`.
 */
const parseAllowedOrigins = () => {
  const origins = env.ALLOWED_ORIGINS ?? [];
  const frontend = env.APP_URL ? [env.APP_URL] : [];

  return [...new Set([...origins, ...frontend])];
};

/** Frozen backend settings consumed by routes, services, database clients, and startup logging. */
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
    anonScoringUsageRetentionDays: env.ANON_SCORING_USAGE_RETENTION_DAYS,
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
    // Development and tests skip polling to avoid duplicate uptime rows from local server restarts.
    pollingEnabled: isProduction,
    pollIntervalMs: env.UPTIME_CHECKS_POLL_INTERVAL_MS,
    maxHistoryPerEndpoint: env.UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT,
    queryWindowDaysLimit: env.UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT,
    retentionDays: env.UPTIME_CHECKS_RETENTION_DAYS,
    cleanupOnStart: env.UPTIME_CHECKS_CLEANUP_ON_START,
    cleanupIntervalDurationMs: env.UPTIME_CHECKS_CLEANUP_INTERVAL_MS,
    endpoints: HEALTH_ENDPOINTS.map((endpoint) => endpoint.path),
  },
});
