/** Initialised Supabase client singleton. */

import { createClient } from '@supabase/supabase-js';

import { FRONTEND_CONFIG } from '@/config';

const supabaseUrl = FRONTEND_CONFIG.supabase.url;
const supabaseAnonKey = FRONTEND_CONFIG.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
