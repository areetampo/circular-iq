import { frontendSchema } from './env.schema';

const rawEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL,

  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,

  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
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
