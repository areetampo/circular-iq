/**
 * @module env.schema
 * @description Zod schema for Vite environment variables (URLs, Supabase, test credentials).
 */

import { z } from 'zod';

// Helper to handle the "string true" vs "boolean true" mess in .env files
const booleanSchema = z.preprocess((val) => val === 'true' || val === true, z.boolean());

/**
 * Zod schema for frontend environment variables.
 * Validates URLs, credentials, and configuration settings.
 *
 * @type {z.ZodObject<{
 *   VITE_APP_URL: z.ZodString,
 *   VITE_API_URL: z.ZodString,
 *   VITE_TEST_USER_NAME: z.ZodOptional<z.ZodString>,
 *   VITE_TEST_USER_NAME_EXT: z.ZodOptional<z.ZodString>,
 *   VITE_TEST_USER_PASSWORD: z.ZodOptional<z.ZodString>,
 *   VITE_SUPABASE_URL: z.ZodString,
 *   VITE_SUPABASE_ANON_KEY: z.ZodString,
 *   MODE: z.ZodEnum<['development', 'staged', 'test', 'production']>,
 *   PROD: z.ZodBoolean
 * }>}
 */
export const frontendSchema = z
  .object({
    MODE: z
      .enum(['development', 'staged', 'test', 'production', 'frontend'], {
        errorMap: () => ({
          message: 'MODE must be development, staged, test, production, or frontend',
        }),
      })
      .default('development')
      .transform((val) => (val === 'frontend' ? 'development' : val)),
    PROD: booleanSchema.default(false),

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
    VITE_SUPABASE_ANON_KEY: z.string().trim().min(1, 'Supabase Anon Key is required'),

    VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(5000, 'VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS must be at least 5000ms')
      .default(30000),
    VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT: z.coerce
      .number()
      .int()
      .min(1, 'VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT must be at least 1')
      .max(86400, 'VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT must be at most 86400')
      .default(86400),
    VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT: z.coerce
      .number()
      .int()
      .min(1, 'VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT must be at least 1')
      .max(28, 'VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT must be at most 28')
      .default(28),
  })
  .refine(
    (data) => {
      // If in production, VITE_API_URL should not be localhost
      if (data.PROD && data.VITE_API_URL.includes('localhost')) {
        return false;
      }
      return true;
    },
    {
      message: 'Production build cannot use localhost API URL',
      path: ['VITE_API_URL'],
    },
  );
