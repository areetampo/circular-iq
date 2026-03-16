import { frontendSchema } from './env.schema';

const rawEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:3000',

  VITE_SUPABASE_URL:
    import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY:
    import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-key',

  MODE: import.meta.env.MODE || process.env.MODE || process.env.NODE_ENV || 'development',
  PROD: import.meta.env.PROD ?? process.env.NODE_ENV === 'production',
};

const result = frontendSchema.safeParse(rawEnv);

if (!result.success) {
  console.error('❌ Frontend Environment Validation Failed:', result.error.flatten().fieldErrors);

  // In development, this helps catch issues immediately in the browser console
  if (import.meta.env.DEV) {
    alert('Environment Variable Error: Check browser console');
  }

  throw new Error('Invalid environment configuration');
}

const env = result.data;

const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

export const FRONTEND_CONFIG = deepFreeze({
  apiBaseUrl: env.VITE_API_URL,

  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },

  isProd: env.PROD,
  mode: env.MODE,
});
