import crypto from 'crypto';

import { envSchema } from '#config/env.schema.js';

/* ------------------------------ */
/* Test-friendly defaults */
/* ------------------------------ */
// Provide robust defaults to keep tests from failing on CI/local without secrets
if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
  // Load .env.backend for tests to access real environment variables
  import('dotenv')
    .then(({ config }) => {
      config({ path: '../env/.env.backend' });
    })
    .catch(() => {
      // If dotenv fails, continue with fallback defaults
    });

  // override to known-good values regardless of what tests may have set
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai';
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key-0000000000';
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
  // additional supabase db defaults for tests (not usually used)
  process.env.SUPABASE_HOST = process.env.SUPABASE_HOST || 'localhost';
  process.env.SUPABASE_PORT = process.env.SUPABASE_PORT || '5432';
  process.env.SUPABASE_DATABASE = process.env.SUPABASE_DATABASE || 'postgres';
  process.env.SUPABASE_USER = process.env.SUPABASE_USER || 'postgres';
  process.env.SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD || 'password';
  process.env.SUPABASE_CONNECTION_STRING = process.env.SUPABASE_CONNECTION_STRING || '';
  process.env.SUPABASE_CONNECTION_LIMIT = process.env.SUPABASE_CONNECTION_LIMIT || '20';
  process.env.AIVEN_CONNECTION_LIMIT = process.env.AIVEN_CONNECTION_LIMIT || '20';
  process.env.AIVEN_CA_CERT = process.env.AIVEN_CA_CERT || '';
  // Aiven defaults for tests
  process.env.AIVEN_HOST = process.env.AIVEN_HOST || 'localhost';
  process.env.AIVEN_PORT = process.env.AIVEN_PORT || '5432';
  process.env.AIVEN_DATABASE = process.env.AIVEN_DATABASE || 'postgres';
  process.env.AIVEN_USER = process.env.AIVEN_USER || 'postgres';
  process.env.AIVEN_PASSWORD = process.env.AIVEN_PASSWORD || 'password';
  process.env.AIVEN_SSL_MODE = process.env.AIVEN_SSL_MODE || 'disable';
  process.env.AIVEN_CONNECTION_STRING = process.env.AIVEN_CONNECTION_STRING || '';
  // Frontend and CORS defaults
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
  process.env.PUBLIC_ROUTES =
    process.env.PUBLIC_ROUTES || '/health,/api/score,/api/assessments/market-analysis';
  // Other defaults
  process.env.MAX_FREE_TRIES = process.env.MAX_FREE_TRIES || '5';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
  process.env.API_AUTH_ENABLED = process.env.API_AUTH_ENABLED || 'false';
  process.env.API_KEY = process.env.API_KEY || '';
  process.env.STRICT_ENV = process.env.STRICT_ENV || 'false';
}

/* ------------------------------ */
/* Snapshot + Validation */
/* ------------------------------ */

let parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:\n');
  console.error(parsed.error.format());

  // During test runs we prefer to continue with safe defaults rather than exiting.
  if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
    console.warn('Continuing in test mode with fallback environment defaults.');
    // override everything with guaranteed-valid test values
    process.env.OPENAI_API_KEY = 'test-openai';
    process.env.SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_ANON_KEY = 'anon-key-0000000000';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.API_AUTH_ENABLED = 'false';

    parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.warn(
        'Fallback defaults still failed validation; proceeding with parsed values where possible.',
      );
    }
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
      `❌ STRICT_ENV enabled. Missing explicit values for: ${missingExplicit.join(', ')}`,
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
 * Builds database configuration based on environment flag
 * Note: we no longer support a separate archives table; both Supabase and Aiven
 * will target the single `documents` table. Function names are static and
 * correspond to the RPC helpers deployed in each database.
 * @private
 */
const buildDatabaseConfig = () => {
  const tableName = 'documents';

  const functions = {
    match_documents: 'match_documents',
    search_documents_by_industry: 'search_documents_by_industry',
    search_documents_by_category: 'search_documents_by_category',
    search_documents_hybrid: 'search_documents_hybrid',
    search_documents_hybrid_filtered: 'search_documents_hybrid_filtered',
    truncate_documents: 'truncate_documents',
    get_document_statistics: 'get_document_statistics',
    count_documents_by_category: 'count_documents_by_category',
    find_recent_documents: 'find_recent_documents',
  };

  return {
    tables: { documents: tableName },
    functions,
  };
};

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

export const ENV_FINGERPRINT = crypto
  .createHash('sha256')
  .update(
    JSON.stringify({
      ...parsed.data,
      OPENAI_API_KEY: '[Redacted]',
      SUPABASE_SERVICE_ROLE_KEY: '[Redacted]',
    }),
  )
  .digest('hex');
