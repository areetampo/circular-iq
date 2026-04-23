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
  logger.error('✕ Environment validation failed');
  logger.error(parsed.error.format());

  // For test environment, fail if validation fails; no fallbacks
  if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
    logger.error(
      '✕ Test environment validation failed. Ensure all required variables are set in env/.env.test',
    );
    process.exit(1);
  } else {
    process.exit(1);
  }
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
    logger.error({ missingExplicit }, 'STRICT_ENV enabled and missing explicit values');
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

const parseAllowedOrigins = () => {
  // Only include localhost if we are NOT in production
  const defaults =
    env.NODE_ENV !== 'production'
      ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']
      : [];

  const origins = env.ALLOWED_ORIGINS ?? [];
  const frontend = env.APP_URL ? [env.APP_URL] : [];

  return [...new Set([...defaults, ...origins, ...frontend])];
};

const parsePublicRoutes = () => {
  const defaults = [
    '/health',
    '/health/detailed',
    '/health/database',
    '/health/openai',
    '/health/system',
    '/health/config',
    '/health/readiness',
    '/health/liveness',
    '/health/version',
  ];
  const routes = env.PUBLIC_ROUTES ?? [];

  if (env.NODE_ENV === 'test') {
    return [
      '/health',
      '/health/detailed',
      '/health/database',
      '/health/openai',
      '/health/system',
      '/health/config',
      '/health/readiness',
      '/health/liveness',
      '/health/version',
    ];
  }

  return [...new Set([...defaults, ...routes])];
};

// Factory function to create route matchers for dynamic routes
// Supports patterns like /api/assessments/:id
const createRouteMatchers = (publicRoutes) => {
  return Array.from(publicRoutes).map((route) => {
    // Convert Express-style route patterns to regex
    // Simple implementation for :paramName patterns
    const regexPattern = route
      .replace(/:[^\s/]+/g, '[^/]+') // Replace :param with regex for non-slash chars
      .replace(/\//g, '\\/'); // Escape forward slashes
    return new RegExp(`^${regexPattern}$`);
  });
};

// convert to a Set so that callers can use `.has()` for fast lookup
const publicRoutesSet = new Set(parsePublicRoutes());

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

    // Scoring/RAG
    {
      method: 'POST',
      endpoint: '/api/score',
      description: 'RAG Analysis & Scoring (Rate Limited)',
    },

    // Analytics
    { method: 'GET', endpoint: '/api/analytics', description: 'Analytics Summary' },
    { method: 'GET', endpoint: '/api/analytics/enhanced', description: 'Enhanced Analytics' },
    {
      method: 'GET',
      endpoint: '/api/analytics/featured-solutions',
      description: 'Featured Solutions',
    },
    {
      method: 'GET',
      endpoint: '/api/analytics/global-stats',
      description: 'Global System Statistics',
    },
    {
      method: 'POST',
      endpoint: '/api/analytics/embeddings/reindex',
      description: 'Reindex Embeddings',
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
      endpoint: '/api/assessments/:publicId',
      description: 'Get Assessment by ID (Auth Required)',
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
    publicRoutes: publicRoutesSet,
    routeMatchers: createRouteMatchers(publicRoutesSet),

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
