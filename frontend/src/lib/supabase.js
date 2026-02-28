/**
 * Supabase Client Configuration
 *
 * Initializes the Supabase client with URL and anon key from environment variables.
 * Used for authentication and real-time updates.
 */

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
