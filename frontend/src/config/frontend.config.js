/**
 * Validates Vite runtime environment values and exports the frozen frontend configuration object.
 * Falls back to `process.env` for tests and SSR-like imports, then fails fast on invalid or unsafe production URLs.
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
  logger.error('[CONFIG:ENV_VALIDATION_FAILED]', parsed.error.format());
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
    logger.error('[CONFIG:STRICT_ENV_MISSING]', { missingExplicit });
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

/**
 * Deep-frozen frontend runtime configuration consumed by API, auth, Supabase, routing, and uptime UI modules.
 * Groups app URLs, test login credentials, Supabase keys, uptime query limits, route metadata, and route behavior notes.
 */
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
    refetchIntervalMs: env.VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS, // Uptime dashboard refetch cadence; keep aligned with backend polling cadence.
    maxHistoryPerEndpoint: env.VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT, // Export/history cap per endpoint; 21600 covers roughly 30 days at a 2-minute cadence.
    queryWindowDaysLimit: env.VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT, // Frontend lookback cap in days; keep in sync with backend and database query-window settings.
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
