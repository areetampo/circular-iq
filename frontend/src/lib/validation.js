/**
 * @module validation
 * @description Input validation and character counting helpers.
 * Provides functions for character counting, input validation, UUID validation,
 * and Zod schemas for authentication (username/password) validation.
 */

import { z } from 'zod';

/**
 * Count meaningful characters (excluding leading/trailing whitespace)
 * Matches the validation logic in App.jsx
 * @param {string} text - Text to count
 * @returns {number} Character count
 */
export function getCharacterCount(text) {
  if (!text && text !== 0) return 0;
  const stringText = String(text);
  // Remove all whitespace but keep character count for validation
  return stringText.replace(/\s+/g, '').trim().length;
}

/**
 * Validate input before submission
 * @param {string} problem - Problem description
 * @param {string} solution - Solution description
 * @param {number} minLength - Minimum length (default 50)
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateInput(problem, solution, minLength = 50) {
  if (!problem || !solution) {
    return {
      valid: false,
      error: 'Both problem and solution are required',
    };
  }

  const problemLength = getCharacterCount(problem);
  const solutionLength = getCharacterCount(solution);

  if (problemLength < minLength) {
    return {
      valid: false,
      error: `Problem must be at least ${minLength} characters (currently ${problemLength})`,
    };
  }

  if (solutionLength < minLength) {
    return {
      valid: false,
      error: `Solution must be at least ${minLength} characters (currently ${solutionLength})`,
    };
  }

  return { valid: true };
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID format
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * ============================================
 * AUTHENTICATION VALIDATION SCHEMAS (Zod)
 * ============================================
 * Shared validation for username and password across Login and Signup forms.
 * Uses zod for runtime validation with automatic trimming.
 *
 * SECURITY NOTE:
 * These schemas mirror the backend trigger (force_internal_email) and the
 * profiles table CHECK constraint. All three must stay in sync.
 * Frontend Zod = fast UX feedback.
 * DB trigger    = enforces rules even if someone bypasses the frontend.
 * DB constraint = the absolute hard floor — database physically refuses bad data.
 */

// ============================================
// Validation Constants
// ============================================
// Single source of truth for all length / pattern rules.
// Referenced in both schemas and in the hint text rendered below each input.

/**
 * Shared username/password length and pattern rules for auth forms.
 * Mirrors backend `force_internal_email` trigger and `profiles` CHECK constraints.
 *
 * @type {{
 *   USERNAME: { MIN_LENGTH: number, MAX_LENGTH: number, PATTERN: RegExp, PATTERN_DESC: string },
 *   PASSWORD: { MIN_LENGTH: number, MAX_LENGTH: number, PATTERN: RegExp, PATTERN_DESC: string }
 * }}
 */
export const AUTH_VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    /**
     * ^(?=.*[a-zA-Z])   — must contain at least one letter (lookahead)
     * [a-zA-Z0-9_-]+$   — only letters, digits, underscores, hyphens; no spaces
     *
     * This mirrors the Postgres regex used in:
     *   • force_internal_email() BEFORE INSERT trigger
     *   • profiles.username_valid_format CHECK constraint
     */
    PATTERN: /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/,
    PATTERN_DESC: 'letters, numbers, - and _ only \nat least one letter \nno spaces',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 30,
    /**
     * ^\S*              — no leading spaces (and combined with the trailing \S* ensures no spaces anywhere)
     * (?=.*[!@#$%^&*(),.?":{}|<>])  — must include at least one special character
     * \S*$              — no trailing spaces; \S matches any non-whitespace character
     */
    PATTERN: /^\S*(?=.*[!@#$%^&*(),.?":{}|<>])\S*$/,
    PATTERN_DESC: 'at least one special character (!@#$%^&* etc.) \nno spaces',
  },
};

// ============================================
// Login Schema
// ============================================
// Intentionally uses the same strict username schema as signup.
// This prevents login-based user enumeration: an attacker cannot probe
// "does this malformed username exist?" because it is rejected locally
// before a network request is ever made.

// Login schema — intentionally minimal.
// Only enforces that both fields are non-empty and within length bounds.
// No pattern/character rules: those belong to signup. A wrong-but-syntactically-
// valid credential just gets a generic 'incorrect username or password' from the server.

/**
 * Zod schema for login form — minimal length checks only (no pattern rules).
 * @type {import('zod').ZodObject<{username: import('zod').ZodString, password: import('zod').ZodString}>}
 */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(
      AUTH_VALIDATION.USERNAME.MAX_LENGTH,
      `Username must be at most ${AUTH_VALIDATION.USERNAME.MAX_LENGTH} characters`,
    ),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(
      AUTH_VALIDATION.PASSWORD.MAX_LENGTH,
      `Password must be at most ${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} characters`,
    ),
});

// ============================================
// Signup Schema
// ============================================

/**
 * Zod schema for signup form — full username/password rules plus confirm-password match.
 * @type {import('zod').ZodEffects<import('zod').ZodObject>}
 */
export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(
        AUTH_VALIDATION.USERNAME.MIN_LENGTH,
        `Username must be at least ${AUTH_VALIDATION.USERNAME.MIN_LENGTH} characters`,
      )
      .max(
        AUTH_VALIDATION.USERNAME.MAX_LENGTH,
        `Username must be at most ${AUTH_VALIDATION.USERNAME.MAX_LENGTH} characters`,
      )
      .regex(AUTH_VALIDATION.USERNAME.PATTERN, {
        message: `Username: ${AUTH_VALIDATION.USERNAME.PATTERN_DESC}`,
      })
      // Explicitly block @ before the regex so the error message is unambiguous.
      // This also prevents any attempt to inject an @ce.internal email directly.
      .refine((val) => !val.includes('@'), {
        message: 'Username cannot contain @',
      }),
    password: z
      .string()
      // No .trim() on passwords — a trailing space is a valid mistake to surface,
      // but we still enforce no-spaces via the regex pattern below.
      .min(
        AUTH_VALIDATION.PASSWORD.MIN_LENGTH,
        `Password must be at least ${AUTH_VALIDATION.PASSWORD.MIN_LENGTH} characters`,
      )
      .max(
        AUTH_VALIDATION.PASSWORD.MAX_LENGTH,
        `Password must be at most ${AUTH_VALIDATION.PASSWORD.MAX_LENGTH} characters`,
      )
      .regex(AUTH_VALIDATION.PASSWORD.PATTERN, {
        message: `Password: ${AUTH_VALIDATION.PASSWORD.PATTERN_DESC}`,
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================
// Authentication Validation Helper Functions
// ============================================
// These functions provide granular validation for real-time feedback
// in the signup form. They complement the Zod schemas above.

/**
 * Checks if trimmed username length is within allowed range.
 * @param {string} value - Username input.
 * @returns {boolean} True if length between MIN and MAX.
 */
export function validateUsernameLength(value) {
  const length = value?.trim().length || 0;
  return (
    length >= AUTH_VALIDATION.USERNAME.MIN_LENGTH && length <= AUTH_VALIDATION.USERNAME.MAX_LENGTH
  );
}

/**
 * Checks if username contains only letters, numbers, underscore or hyphen.
 * @param {string} value - Username input.
 * @returns {boolean} True if only allowed characters.
 */
export function validateUsernameChars(value) {
  const trimmed = value?.trim() || '';
  // Only letters, numbers, - and _ allowed
  const charsRegex = /^[a-zA-Z0-9_-]+$/;
  return charsRegex.test(trimmed);
}

/**
 * Ensures username contains at least one letter (a-z or A-Z).
 * @param {string} value - Username input.
 * @returns {boolean} True if at least one letter present.
 */
export function validateUsernameHasLetter(value) {
  const trimmed = value?.trim() || '';
  // Must contain at least one letter
  const letterRegex = /[a-zA-Z]/;
  return letterRegex.test(trimmed);
}

/**
 * Verifies username has no spaces (any whitespace) in raw input.
 * @param {string} value - Username input (untrimmed).
 * @returns {boolean} True if no spaces.
 */
export function validateUsernameNoSpaces(value) {
  // No spaces allowed - check the actual value without trimming
  const noSpacesRegex = /^\S*$/;
  return noSpacesRegex.test(value || '');
}

/**
 * Checks if password length is within allowed range.
 * @param {string} value - Password input.
 * @returns {boolean} True if length between MIN and MAX.
 */
export function validatePasswordLength(value) {
  const length = value?.length || 0;
  return (
    length >= AUTH_VALIDATION.PASSWORD.MIN_LENGTH && length <= AUTH_VALIDATION.PASSWORD.MAX_LENGTH
  );
}

/**
 * Ensures password contains at least one special character.
 * @param {string} value - Password input.
 * @returns {boolean} True if special character found.
 */
export function validatePasswordSpecialChar(value) {
  // Must include at least one special character
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  return specialCharRegex.test(value || '');
}

/**
 * Verifies password has no spaces (any whitespace) in raw input.
 * @param {string} value - Password input (untrimmed).
 * @returns {boolean} True if no spaces.
 */
export function validatePasswordNoSpaces(value) {
  // No spaces allowed - check the actual value without trimming
  const noSpacesRegex = /^\S*$/;
  return noSpacesRegex.test(value || '');
}

/**
 * Checks if password and confirm password match.
 * @param {string} password - Password input.
 * @param {string} confirmPassword - Confirm password input.
 * @returns {boolean} True if passwords match.
 */
export function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0;
}
