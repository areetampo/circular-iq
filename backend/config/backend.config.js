import '#config/loadEnv.js';
import crypto from 'crypto';

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
let parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('✕ Environment validation failed:\n');
  console.error(parsed.error.format());

  // For test environment, fail if validation fails; no fallbacks
  if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
    console.error(
      'Test environment validation failed. Ensure all required variables are set in env/.env.test',
    );
    process.exit(1);
  } else {
    process.exit(1);
  }
}

const env = Object.freeze({ ...(parsed.success ? parsed.data : {}) });

/* ------------------------------ */
/* Strict CI Enforcement */
/* ------------------------------ */

if (env.STRICT_ENV) {
  const missingExplicit = Object.entries(parsed.data)
    .filter(([key]) => !(key in process.env))
    .map(([key]) => key);

  if (missingExplicit.length > 0) {
    console.error(
      `✕ STRICT_ENV enabled. Missing explicit values for: ${missingExplicit.join(', ')}`,
    );
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

  // env.ALLOWED_ORIGINS may be undefined if validation failed; fall back to empty array
  const origins = Array.isArray(env.ALLOWED_ORIGINS) ? env.ALLOWED_ORIGINS : [];

  // env.FRONTEND_URL may also be undefined
  const frontend = env.FRONTEND_URL ? [env.FRONTEND_URL] : [];

  return [...new Set([...defaults, ...origins, ...frontend])];
};

const parsePublicRoutes = () => {
  // /health and search endpoint are ALWAYS included as public routes
  const defaults = ['/health', '/api/search'];

  // env.PUBLIC_ROUTES may be undefined if validation failed; treat as empty
  const routes = Array.isArray(env.PUBLIC_ROUTES) ? env.PUBLIC_ROUTES : [];

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
const publicRoutes = new Set(parsePublicRoutes());

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
  tables: {
    documents: 'documents',
  },
  functions: Object.fromEntries(DB_FUNCTIONS.map((n) => [n, n])),
});

export const BACKEND_CONFIG = deepFreeze({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',

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

  // computed flag - true means we query Supabase for documents, false => Aiven
  useSupabaseDocuments: env.USE_SUPABASE_DOCUMENTS_TABLE,

  app: {
    frontendUrl: env.FRONTEND_URL,
    allowedOrigins: parseAllowedOrigins(),
    publicRoutes,
    routeMatchers: createRouteMatchers(publicRoutes),

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
      ...parsed.data,
      ...Object.fromEntries(redacted.map((key) => [key, '[Redacted]'])),
    }),
  )
  .digest('hex');
