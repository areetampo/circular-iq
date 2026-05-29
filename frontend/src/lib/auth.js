/**
 * Authentication helpers for username-based Supabase auth.
 * Single module that owns the username → Supabase identity mapping.
 * Supabase Auth requires an email-format identifier internally. This app uses
 * username-only auth; a DB trigger maps every username to an internal domain at
 * signup. That domain is an implementation detail of the infrastructure layer
 * and must never appear in UI components, logs shown to users, or API responses.
 *
 * RULE: the string that encodes the internal domain lives ONLY in this file.
 * LoginForm, SignupForm, and any future auth surface import these functions and
 * pass only plain usernames — they never construct or even see the internal address.
 */

import { supabase } from '@/lib/supabase';

// The internal email domain used by the DB trigger.
// Defined once here; referenced nowhere else in the codebase.
const AUTH_DOMAIN = 'ce.internal';

/**
 * Maps a normalized username to the internal Supabase email identifier.
 *
 * @param {string} username - Already-trimmed lowercase username stored in auth metadata.
 * @returns {string} Internal `ce.internal` address used only for Supabase Auth calls.
 */
const toAuthEmail = (username) => `${username}@${AUTH_DOMAIN}`;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign in an existing user by username + password.
 *
 * @param {string} username - Plain username entered by the user; normalized before internal email mapping.
 * @param {string} password - Password forwarded to Supabase Auth.
 * @returns {Promise<{ data: import('@supabase/supabase-js').AuthResponse['data'], error: import('@supabase/supabase-js').AuthError | null }>} Supabase sign-in response for the internally mapped username.
 */
export async function signInWithUsername(username, password) {
  const email = toAuthEmail(username.trim().toLowerCase());
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Create a new user account by username + password.
 * Passes the raw username in metadata so the BEFORE INSERT trigger
 * (force_internal_email) can validate and overwrite the email field.
 *
 * @param {string} username - Plain username to store in metadata after normalization.
 * @param {string} password - Password forwarded to Supabase Auth signup.
 * @returns {Promise<{ data: import('@supabase/supabase-js').AuthResponse['data'], error: import('@supabase/supabase-js').AuthError | null }>} Supabase signup response for the internally mapped username.
 */
export async function signUpWithUsername(username, password) {
  const normalized = username.trim().toLowerCase();
  const email = toAuthEmail(normalized);
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: normalized },
    },
  });
}
