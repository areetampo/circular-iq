import { frontendSchema } from './env.schema';

const rawEnv = {
  VITE_APP_URL: import.meta.env.VITE_APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173',

  VITE_API_URL: import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:3000',

  VITE_SUPABASE_URL:
    import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY:
    import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-key',

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
    apiBaseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL ?? 'https://test.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'test-anon-key',
    },
    isProd: false,
    mode: 'test',
  };
  // Skip all validation in test mode
} else {
  if (!result.success) {
    console.error(
      '[ERROR]: \u274c Frontend Environment Validation Failed:',
      result.error.flatten().fieldErrors,
    );
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
      apiBaseUrl: env.VITE_API_URL,
      supabase: {
        url: env.VITE_SUPABASE_URL,
        anonKey: env.VITE_SUPABASE_ANON_KEY,
      },
      isProd: env.PROD,
      mode: env.MODE,
    };
  }
}

export const FRONTEND_CONFIG = deepFreeze(validatedConfig);
