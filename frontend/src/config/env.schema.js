// env.schema.js

/**
 * @module env.schema
 * @description Zod schemas for validating frontend environment variables.
 * Defines strict validation rules for all Vite environment variables used by the frontend,
 * with separate schemas for production/development and test environments.
 */

import { z } from 'zod';

/* ------------------------------ */
/* Helpers */
/* ------------------------------ */

const booleanSchema = z.preprocess((val) => val === 'true' || val === true, z.boolean());

/* ------------------------------ */
/* Base Schema */
/* ------------------------------ */

const baseFrontendSchema = z.object({
  MODE: z.enum(['development', 'test', 'staged', 'production', 'frontend'], {
    errorMap: () => ({
      message: 'MODE must be development, test, staged, production, or frontend',
    }),
  }),

  PROD: booleanSchema,

  DEV: booleanSchema.optional(),

  VITE_APP_URL: z.string().trim().url('VITE_APP_URL must be a valid URL'),

  VITE_API_URL: z.string().trim().url('VITE_API_URL must be a valid URL'),

  VITE_TEST_USER_NAME: z.string().trim().min(1, 'VITE_TEST_USER_NAME is required').optional(),

  VITE_TEST_USER_NAME_EXT: z
    .string()
    .trim()
    .min(1, 'VITE_TEST_USER_NAME_EXT is required')
    .optional(),

  VITE_TEST_USER_PASSWORD: z
    .string()
    .trim()
    .min(1, 'VITE_TEST_USER_PASSWORD is required')
    .optional(),

  VITE_SUPABASE_URL: z.string().trim().url('VITE_SUPABASE_URL must be a valid URL'),

  VITE_SUPABASE_ANON_KEY: z.string().trim().min(1, 'VITE_SUPABASE_ANON_KEY is required'),

  VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(5000, 'VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS must be at least 5000ms'),

  VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT: z.coerce
    .number()
    .int()
    .min(1, 'VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT must be at least 1')
    .max(21600, 'VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT must be at most 21600'),

  VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT: z.coerce
    .number()
    .int()
    .min(1, 'VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT must be at least 1')
    .max(28, 'VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT must be at most 28'),

  VITE_LOG_LEVEL: z.enum(['info', 'debug', 'warn', 'error'], {
    errorMap: () => ({
      message: 'VITE_LOG_LEVEL must be info, debug, warn, or error',
    }),
  }),

  VITE_STRICT_ENV: booleanSchema,
});

/* ------------------------------ */
/* Main Schema */
/* ------------------------------ */

export const frontendSchema = baseFrontendSchema
  .extend({
    MODE: z
      .enum(['development', 'test', 'staged', 'production', 'frontend'])
      .default('development')
      .transform((val) => (val === 'frontend' ? 'development' : val)),

    PROD: booleanSchema.default(false),

    DEV: booleanSchema.default(true),

    VITE_APP_URL: z
      .string()
      .trim()
      .url('VITE_APP_URL must be a valid URL')
      .default('http://localhost:5173'),

    VITE_API_URL: z
      .string()
      .trim()
      .url('VITE_API_URL must be a valid URL')
      .default('http://localhost:3001'),

    VITE_SUPABASE_URL: z
      .string()
      .trim()
      .url('VITE_SUPABASE_URL must be a valid URL')
      .default('http://localhost:54321'),

    VITE_SUPABASE_ANON_KEY: z
      .string()
      .trim()
      .min(1, 'VITE_SUPABASE_ANON_KEY is required')
      .default('test-anon-key'),

    VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(5000, 'VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS must be at least 5000ms')
      .default(120000),

    VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT: z.coerce
      .number()
      .int()
      .min(1, 'VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT must be at least 1')
      .max(21600, 'VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT must be at most 21600')
      .default(21600),

    VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT: z.coerce
      .number()
      .int()
      .min(1, 'VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT must be at least 1')
      .max(28, 'VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT must be at most 28')
      .default(28),

    VITE_LOG_LEVEL: z.enum(['info', 'debug', 'warn', 'error']).default('info'),

    VITE_STRICT_ENV: booleanSchema.default(false),
  })
  .refine(
    (data) => {
      if (data.PROD && data.VITE_API_URL.includes('localhost')) {
        return false;
      }

      return true;
    },
    {
      message: 'Production build cannot use localhost API URL',
      path: ['VITE_API_URL'],
    },
  )
  .refine(
    (data) => {
      if (data.PROD && data.VITE_APP_URL.includes('localhost')) {
        return false;
      }

      return true;
    },
    {
      message: 'Production build cannot use localhost APP URL',
      path: ['VITE_APP_URL'],
    },
  );

/* ------------------------------ */
/* Test Schema */
/* ------------------------------ */

export const testFrontendSchema = baseFrontendSchema.refine(
  (data) => {
    if (!data.PROD) return true;

    return !data.VITE_API_URL.includes('localhost');
  },
  {
    message: 'Production build cannot use localhost API URL',
    path: ['VITE_API_URL'],
  },
);
