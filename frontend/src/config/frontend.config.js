import { frontendSchema } from './env.schema';

const parsed = frontendSchema.parse(import.meta.env);

if (import.meta.env.PROD && parsed.VITE_API_URL.includes('localhost')) {
  throw new Error(
    '⚠️  Production build cannot use localhost API URL. Please set VITE_API_URL to the correct backend URL.',
  );
}

const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

export const FRONTEND_CONFIG = deepFreeze({
  apiBaseUrl: parsed.VITE_API_URL,

  supabase: {
    url: parsed.VITE_SUPABASE_URL,
    anonKey: parsed.VITE_SUPABASE_ANON_KEY,
  },

  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
});
