/**
 * Backend Configuration
 *
 * Loads and validates environment variables via Zod schemas.
 * Freezes configuration immutably to prevent runtime changes.
 * Supports strict mode for CI/CD environments.
 *
 * Environment sources (in order):
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
 */

import '#config/loadEnv.js';
import crypto from 'crypto';

import pino from 'pino';

const logger = pino({
  name: 'backend.config',
  level: process.env.LOG_LEVEL || 'info',
});

import { envSchema, testEnvSchema } from '#config/env.schema.js';

/* ------------------------------ */
/* Test-friendly defaults */
/* ------------------------------ */
// For tests, no defaults; must be in .env.test
// Removed test defaults to enforce strict env loading

/* ------------------------------ */
/* Snapshot + Validation */
/* ------------------------------ */

const schema = (process.env.NODE_ENV || '').toLowerCase() === 'test' ? testEnvSchema : envSchema;
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
    .filter(([key]) => !(key in process.env))
    .map(([key]) => key);

  if (missingExplicit.length > 0) {
    logger.error({ missingExplicit }, '✕ STRICT_ENV enabled and missing explicit values');
    process.exit(1);
  }
}

/* ------------------------------ */
/* Deep Freeze */
/* ------------------------------ */

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
  'truncate_documents',
  'get_document_statistics',
  'count_documents_by_category',
  'find_recent_documents',
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
export const buildDatabaseConfig = () => ({
  tables: { documents: 'documents' },
  functions: {
    ...Object.fromEntries(DB_FUNCTIONS.map((n) => [n, n])),
    // Ensure all hybrid searches use the full result set (including industry/category/source)
    // even when callers originally used the filtered variant.
    search_documents_hybrid_filtered: 'search_documents_hybrid',
  },
});

const parseAllowedOrigins = () => {
  const origins = env.ALLOWED_ORIGINS ?? [];
  const frontend = env.APP_URL ? [env.APP_URL] : [];

  return [...new Set([...origins, ...frontend])];
};

const parseAuthAllowList = () => {
  const healthRoutes = env.HEALTH_ROUTES ?? [];
  const publicRoutes = env.PUBLIC_ROUTES ?? [];

  return [...new Set([...healthRoutes, ...publicRoutes])];
};

// Factory function to create route matchers for dynamic routes
// Supports patterns like /api/assessments/:id
const createRouteMatchers = (publicRoutes) => {
  const matchers = Array.from(publicRoutes).map((route) => {
    // Convert Express-style route patterns to regex
    // Simple implementation for :paramName patterns
    const regexPattern = route
      .replace(/:[^\s/]+/g, '[^/]+') // Replace :param with regex for non-slash chars
      .replace(/\//g, '\\/'); // Escape forward slashes
    const matcher = new RegExp(`^${regexPattern}$`);
    logger.info(
      { route, regexPattern, matcher },
      'Creating route matcher: route -> regexPattern -> matcher',
    );
    return matcher;
  });
  logger.info({ matchersLength: matchers.length }, 'Total route matchers created');
  return matchers;
};

// convert to a Set so that callers can use `.has()` for fast lookup
const authAllowListSet = new Set(parseAuthAllowList());

export const BACKEND_CONFIG = deepFreeze({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',

  testCredentials: {
    username: env.TEST_USER_NAME,
    usernameExt: env.TEST_USER_NAME_EXT,
    password: env.TEST_USER_PASSWORD,
  },

  api: [
    // Health & Root
    { method: 'GET', endpoint: '/health', description: 'Basic Health Check (Load Balancer)' },
    { method: 'GET', endpoint: '/health/detailed', description: 'Comprehensive Health Check' },
    { method: 'GET', endpoint: '/health/database', description: 'Database Health Check' },
    { method: 'GET', endpoint: '/health/openai', description: 'OpenAI API Health Check' },
    { method: 'GET', endpoint: '/health/system', description: 'System Resources Health Check' },
    { method: 'GET', endpoint: '/health/config', description: 'Configuration Health Check' },
    { method: 'GET', endpoint: '/health/readiness', description: 'Kubernetes Readiness Probe' },
    { method: 'GET', endpoint: '/health/liveness', description: 'Kubernetes Liveness Probe' },
    { method: 'GET', endpoint: '/health/version', description: 'Version and Build Information' },
    { method: 'GET', endpoint: '/', description: 'Welcome/Root Endpoint' },

    // User Profile
    { method: 'GET', endpoint: '/api/profile', description: 'User Profile Data (Auth Required)' },

    // Search
    {
      method: 'GET',
      endpoint: '/api/search/ce-cases',
      description: 'Search Circular Economy Cases Knowledge Base',
    },

    // Scoring/RAG
    {
      method: 'POST',
      endpoint: '/api/score',
      description: 'RAG Analysis & Scoring (Rate Limited)',
    },
    {
      method: 'POST',
      endpoint: '/api/score/stream',
      description: 'RAG Analysis & Scoring with SSE Streaming (Rate Limited)',
    },
    {
      method: 'GET',
      endpoint: '/api/analytics/global-stats',
      description: 'Global Dashboard Statistics',
    },

    // Assessments
    {
      method: 'POST',
      endpoint: '/api/assessments',
      description: 'Create Assessment (Auth Required)',
    },
    {
      method: 'GET',
      endpoint: '/api/assessments',
      description: 'List User Assessments (Auth Required)',
    },
    {
      method: 'GET',
      endpoint: '/api/assessments/stats',
      description: 'Assessment Statistics (Auth Required)',
    },
    {
      method: 'GET',
      endpoint: '/api/assessments/compare',
      description: 'Compare Two Assessments (Auth Required)',
    },
    {
      method: 'GET',
      endpoint: '/api/assessments/public/:publicId',
      description: 'Get Public Assessment (No Auth)',
    },
    {
      method: 'GET',
      endpoint: '/api/assessments/validate/:publicId',
      description: 'Validate Public Assessment ID',
    },
    {
      method: 'GET',
      endpoint: '/api/assessments/:publicId',
      description: 'Get Assessment by Public ID (Auth Required)',
    },
    {
      method: 'PATCH',
      endpoint: '/api/assessments/:id',
      description: 'Update Assessment (Auth Required)',
    },
    {
      method: 'DELETE',
      endpoint: '/api/assessments/:id',
      description: 'Delete Assessment (Auth Required)',
    },
  ],

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
    sslCA: env.AIVEN_CA_CERT,
  },

  db: buildDatabaseConfig(),

  useSupabaseDocuments: env.USE_SUPABASE_DOCUMENTS_TABLE,

  app: {
    appUrl: env.APP_URL,
    apiUrl: env.API_URL,

    allowedOrigins: parseAllowedOrigins(),
    healthRoutes: new Set(env.HEALTH_ROUTES ?? []),
    publicRoutesOnly: new Set(env.PUBLIC_ROUTES ?? []),
    authAllowList: authAllowListSet,
    routeMatchers: createRouteMatchers(authAllowListSet),

    maxFreeTries: env.MAX_FREE_TRIES,

    logLevel: env.LOG_LEVEL,

    apiAuthEnabled: env.API_AUTH_ENABLED,
    apiKey: env.API_KEY,
    strictEnv: env.STRICT_ENV,
  },
});

/* ------------------------------ */
/* Environment Fingerprint (optional debugging) */
/* ------------------------------ */

const redacted = [
  'OPENAI_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PASSWORD',
  'SUPABASE_CONNECTION_STRING',
  'AIVEN_PASSWORD',
  'AIVEN_CONNECTION_STRING',
  'AIVEN_CA_CERT',
  'API_KEY',
];

export const ENV_FINGERPRINT = crypto
  .createHash('sha256')
  .update(
    JSON.stringify({
      ...env,
      ...Object.fromEntries(redacted.map((key) => [key, '[Redacted] (❁´◡`❁)'])),
    }),
  )
  .digest('hex');
