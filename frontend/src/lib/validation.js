/** Input validation and character counting helpers. */

import { z } from 'zod';

/**
 * Count meaningful characters (excluding leading/trailing whitespace)
 * Matches the validation logic in App.jsx
 * @param {string} text - Text to count
 * @returns {number} Character count
 */
export function getCharacterCount(text) {
  if (!text) return 0;
  return text.replace(/\s+/g, '').trim().length;
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
 * Validate assessment name
 * @param {string} name - Assessment name
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateAssessmentName(name) {
  if (!name) {
    return {
      valid: false,
      error: 'Assessment name is required',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Assessment name cannot be empty',
    };
  }

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'Assessment name must be at least 3 characters',
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Assessment name must be less than 100 characters',
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateEmail(email) {
  if (!email) {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }

  return { valid: true };
}

/**
 * Validate parameter values
 * @param {Object} parameters - Parameter object
 * @returns {Object} Validation result {valid: boolean, errors?: Object}
 */
export function validateParameters(parameters) {
  const errors = {};
  const validKeys = [
    'public_participation',
    'infrastructure',
    'market_price',
    'maintenance',
    'uniqueness',
    'size_efficiency',
    'chemical_safety',
    'tech_readiness',
  ];

  for (const key of validKeys) {
    const value = parameters[key];

    if (value === undefined || value === null) {
      errors[key] = 'Parameter value is required';
      continue;
    }

    if (typeof value !== 'number') {
      errors[key] = 'Parameter must be a number';
      continue;
    }

    if (value < 0 || value > 100) {
      errors[key] = 'Parameter must be between 0 and 100';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateUrl(url) {
  if (!url) {
    return {
      valid: false,
      error: 'URL is required',
    };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL',
    };
  }
}

/**
 * Validate phone number (basic US format)
 * @param {string} phone - Phone number
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validatePhone(phone) {
  if (!phone) {
    return {
      valid: false,
      error: 'Phone number is required',
    };
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 10) {
    return {
      valid: false,
      error: 'Phone number must be 10 digits',
    };
  }

  return { valid: true };
}

/**
 * Check if text meets minimum word count
 * @param {string} text - Text to check
 * @param {number} minWords - Minimum word count
 * @returns {boolean} True if meets requirement
 */
export function meetsMinWordCount(text, minWords) {
  if (!text) return false;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.length >= minWords;
}

/**
 * Get word count from text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
export function getWordCount(text) {
  if (!text) return 0;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.length;
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
// Username Schema
// ============================================

export const usernameSchema = z
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
  });

// ============================================
// Password Schema
// ============================================

export const passwordSchema = z
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
  });

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

export const signupSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
