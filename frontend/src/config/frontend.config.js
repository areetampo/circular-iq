import { FRONTEND_ROUTES } from '@/constants';

import { frontendSchema } from './env.schema';

const rawEnv = {
  VITE_APP_URL: import.meta.env.VITE_APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173',
  VITE_API_URL: import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:3000',

  VITE_TEST_USER_NAME: import.meta.env.VITE_TEST_USER_NAME || process.env.VITE_TEST_USER_NAME,
  VITE_TEST_USER_NAME_EXT:
    import.meta.env.VITE_TEST_USER_NAME_EXT || process.env.VITE_TEST_USER_NAME_EXT,
  VITE_TEST_USER_PASSWORD:
    import.meta.env.VITE_TEST_USER_PASSWORD || process.env.VITE_TEST_USER_PASSWORD,

  VITE_SUPABASE_URL:
    import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY:
    import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-key',

  VITE_SCORING_MAX_FREE_TRIES:
    import.meta.env.VITE_SCORING_MAX_FREE_TRIES || process.env.VITE_SCORING_MAX_FREE_TRIES || '20',

  MODE: import.meta.env.MODE || process.env.MODE || process.env.NODE_ENV || 'development',
  PROD: import.meta.env.PROD ?? process.env.NODE_ENV === 'production',
};

const result = frontendSchema.safeParse(rawEnv);

// Helper for deep freezing
const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

// Handle Test Mode / Failure Logic
let validatedConfig;

// Test mode bypass: skip all validation if running in test mode
const isTest = rawEnv.MODE === 'test' || process.env.NODE_ENV === 'test';
if (isTest) {
  validatedConfig = {
    appUrl: import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
    apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',

    testCredentials: {
      username: import.meta.env.VITE_TEST_USER_NAME,
      usernameExt: import.meta.env.VITE_TEST_USER_NAME_EXT,
      password: import.meta.env.VITE_TEST_USER_PASSWORD,
    },

    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL ?? 'https://test.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'test-anon-key',
    },

    uptimeMonitor: {
      refetchIntervalMs: 30_000, // Frontend polling interval for uptime monitor data (matches backend)
    },

    scoring: {
      maxFreeTries: Number(import.meta.env.VITE_SCORING_MAX_FREE_TRIES) || 20,
    },

    isProd: false,
    mode: 'test',
  };
  // Skip all validation in test mode
} else {
  if (!result.success) {
    logger.error('Frontend Environment Validation Failed:', result.error.flatten().fieldErrors);
    if (import.meta.env.DEV) {
      alert('Environment Variable Error: Check browser console');
    }
    throw new Error('Invalid environment configuration');
  } else {
    // 2. Handle Success Logic
    const env = result.data;
    // Only reject localhost FRONTEND URL and API URL in production builds
    if (env.PROD && env.VITE_APP_URL && env.VITE_APP_URL.includes('localhost')) {
      throw new Error('Production build cannot use localhost APP URL');
    }
    if (env.PROD && env.VITE_API_URL && env.VITE_API_URL.includes('localhost')) {
      throw new Error('Production build cannot use localhost API URL');
    }
    validatedConfig = {
      appUrl: env.VITE_APP_URL,
      apiUrl: env.VITE_API_URL,

      testCredentials: {
        username: env.VITE_TEST_USER_NAME,
        usernameExt: env.VITE_TEST_USER_NAME_EXT,
        password: env.VITE_TEST_USER_PASSWORD,
      },

      supabase: {
        url: env.VITE_SUPABASE_URL,
        anonKey: env.VITE_SUPABASE_ANON_KEY,
      },

      uptimeMonitor: {
        refetchIntervalMs: 30_000, // Frontend polling interval for uptime monitor data (matches backend)
      },

      scoring: {
        maxFreeTries: env.VITE_SCORING_MAX_FREE_TRIES,
      },

      isProd: env.PROD,
      mode: env.MODE,
    };
  }
}

export const FRONTEND_CONFIG = deepFreeze({
  ...validatedConfig,

  // Frontend Routes Configuration
  // Imported from constants for better organization and reusability
  routes: FRONTEND_ROUTES,

  // Route Behavior Patterns
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
