/**
 * @module frontend.config
 * @description Central configuration loader and validator for the frontend application.
 * Loads and validates Vite environment variables via Zod schemas, freezes configuration
 * immutably to prevent runtime changes, and supports strict mode for test environments.
 *
 * Environment sources (in order of precedence):
 * 1. Vite import.meta.env
 * 2. Process environment variables (tests/SSR)
 *
 * Exports FRONTEND_CONFIG object with sections:
 * - nodeEnv: MODE string
 * - isProduction: Boolean flag
 * - app: Frontend application settings
 * - supabase: Supabase client configuration
 * - uptime: Uptime monitor configuration
 * - testCredentials: E2E / integration test credentials
 * - routes: Frontend routes and route patterns
 */

import { FRONTEND_ROUTES } from '@/constants';

import { frontendSchema, testFrontendSchema } from './env.schema';

/* ------------------------------ */
/* Browser-safe process.env access */
/* ------------------------------ */

// process is a Node.js global unavailable in the browser. All process.env
// references are guarded by this helper so the module is safe to import in
// both browser (Vite) and Node (tests / SSR) contexts.
const proc = typeof process !== 'undefined' ? process : { env: {} };

/* ------------------------------ */
/* Snapshot + Validation */
/* ------------------------------ */

const rawEnv = {
  MODE: import.meta.env.MODE || proc.env.MODE || proc.env.NODE_ENV || 'development',

  PROD: import.meta.env.PROD ?? proc.env.PROD ?? proc.env.NODE_ENV === 'production',

  DEV: import.meta.env.DEV ?? proc.env.DEV ?? proc.env.NODE_ENV !== 'production',

  VITE_APP_URL: import.meta.env.VITE_APP_URL || proc.env.VITE_APP_URL,

  VITE_API_URL: import.meta.env.VITE_API_URL || proc.env.VITE_API_URL,

  VITE_TEST_USER_NAME: import.meta.env.VITE_TEST_USER_NAME || proc.env.VITE_TEST_USER_NAME,

  VITE_TEST_USER_NAME_EXT:
    import.meta.env.VITE_TEST_USER_NAME_EXT || proc.env.VITE_TEST_USER_NAME_EXT,

  VITE_TEST_USER_PASSWORD:
    import.meta.env.VITE_TEST_USER_PASSWORD || proc.env.VITE_TEST_USER_PASSWORD,

  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || proc.env.VITE_SUPABASE_URL,

  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || proc.env.VITE_SUPABASE_ANON_KEY,

  VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS:
    import.meta.env.VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS ||
    proc.env.VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS,

  VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT:
    import.meta.env.VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT ||
    proc.env.VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT,

  VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT:
    import.meta.env.VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT ||
    proc.env.VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT,

  VITE_STRICT_ENV: import.meta.env.VITE_STRICT_ENV || proc.env.VITE_STRICT_ENV,
};

const schema = (rawEnv.MODE || '').toLowerCase() === 'test' ? testFrontendSchema : frontendSchema;

const parsed = schema.safeParse(rawEnv);

if (!parsed.success) {
  logger.error({ error: parsed.error.format() }, '✕ Frontend environment validation failed');

  const isTestEnv = (rawEnv.MODE || '').toLowerCase() === 'test';

  if (isTestEnv) {
    logger.error(
      '✕ Test frontend environment validation failed, ensure all required variables are set',
    );
  } else {
    logger.error(
      '✕ Frontend environment validation failed, check your environment variables configuration',
    );
  }

  throw new Error('Invalid frontend environment configuration');
}

const env = Object.freeze({ ...parsed.data });

/* ------------------------------ */
/* Strict CI Enforcement */
/* ------------------------------ */

if (env.VITE_STRICT_ENV) {
  const missingExplicit = Object.entries(parsed.data)
    .filter(([key]) => !(key in rawEnv) || rawEnv[key] === undefined)
    .map(([key]) => key);

  if (missingExplicit.length > 0) {
    logger.error({ missingExplicit }, '✕ VITE_STRICT_ENV enabled and missing explicit values');

    throw new Error(`Missing required explicit frontend env values: ${missingExplicit.join(', ')}`);
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
/* Production Safety Checks */
/* ------------------------------ */

if (env.PROD && env.VITE_APP_URL.includes('localhost')) {
  throw new Error('Production build cannot use localhost APP URL');
}

if (env.PROD && env.VITE_API_URL.includes('localhost')) {
  throw new Error('Production build cannot use localhost API URL');
}

/* ------------------------------ */
/* Config Object */
/* ------------------------------ */

export const FRONTEND_CONFIG = deepFreeze({
  nodeEnv: env.MODE,

  isProduction: env.PROD,

  app: {
    appUrl: env.VITE_APP_URL,
    apiUrl: env.VITE_API_URL,

    strictEnv: env.VITE_STRICT_ENV,
  },

  testCredentials: {
    username: env.VITE_TEST_USER_NAME,
    usernameExt: env.VITE_TEST_USER_NAME_EXT,
    password: env.VITE_TEST_USER_PASSWORD,
  },

  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },

  uptime: {
    refetchIntervalMs: env.VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS, // Frontend polling interval for uptime monitor data (matches backend's BACKEND_CONFIG.uptime.pollIntervalMs) -> 2 min
    maxHistoryPerEndpoint: env.VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT, // 2min interval -> 30/hr * 24h * 28d = 20160 max checks per endpoint -> 30d = 21600 chosen as sufficient
    queryWindowDaysLimit: env.VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT, // 28 days
  },

  routes: FRONTEND_ROUTES,

  routePatterns: {
    protectedRoute: {
      redirect: '/auth',
      behavior: 'Unauthenticated users are redirected to auth page',
      loading: 'Shows loading spinner during authentication check',
    },

    urlStateManagement: {
      solutions: 'URL is single source of truth for all search state',

      assessments: 'Filter parameters persist in URL for shareability',

      validation: 'Invalid parameters are validated and cleaned up',
    },

    navigation: {
      state: 'React Router state can pass result, formData, isRestored',
    },
  },
});
