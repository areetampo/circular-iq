import { z } from 'zod';

// Helper to handle the "string true" vs "boolean true" mess in .env files
const booleanSchema = z.preprocess((val) => val === 'true' || val === true, z.boolean());

// Transforms "a,b,c" into ["a", "b", "c"] automatically
const commaSeparatedStringArraySchema = z
  .string()
  .default('')
  .transform((str) =>
    str
      ? str
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  );

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staged', 'production'], {
    errorMap: () => ({ message: 'NODE_ENV must be development, test, staged, or production' }),
  }),

  PORT: z.coerce.number().int().positive('PORT must be a positive integer'),

  APP_URL: z.string().trim().url('APP_URL must be a valid URL for CORS and Auth'),
  API_URL: z.string().trim().url('API_URL must be a valid URL for CORS and Auth'),

  TEST_USER_NAME: z.string().trim().min(1, 'TEST_USER_NAME is required').optional(),
  TEST_USER_NAME_EXT: z.string().trim().min(1, 'TEST_USER_NAME_EXT is required').optional(),
  TEST_USER_PASSWORD: z.string().trim().min(1, 'TEST_USER_PASSWORD is required').optional(),

  ALLOWED_ORIGINS: commaSeparatedStringArraySchema.optional(),

  OPENAI_API_KEY: z.string().trim().min(1, 'OPENAI_API_KEY is required for AI functionality'),

  SUPABASE_URL: z.string().trim().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().trim().min(1, 'SUPABASE_ANON_KEY is required for Supabase access'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .trim()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required for Supabase admin access'),
  SUPABASE_HOST: z.string().trim().min(1, 'SUPABASE_HOST is required'),
  SUPABASE_PORT: z.coerce.number().int().positive('SUPABASE_PORT must be a positive integer'),
  SUPABASE_DATABASE: z.string().trim().min(1, 'SUPABASE_DATABASE is required'),
  SUPABASE_USER: z.string().trim().min(1, 'SUPABASE_USER is required'),
  SUPABASE_PASSWORD: z.string().trim().min(1, 'SUPABASE_PASSWORD is required'),
  SUPABASE_CONNECTION_LIMIT: z.coerce
    .number()
    .int()
    .positive('SUPABASE_CONNECTION_LIMIT must be a positive integer'),
  SUPABASE_CONNECTION_STRING: z.string().trim().min(1, 'SUPABASE_CONNECTION_STRING is required'),

  AIVEN_HOST: z.string().trim().min(1, 'AIVEN_HOST is required'),
  AIVEN_PORT: z.coerce.number().int().positive('AIVEN_PORT must be a positive integer'),
  AIVEN_DATABASE: z.string().trim().min(1, 'AIVEN_DATABASE is required'),
  AIVEN_USER: z.string().trim().min(1, 'AIVEN_USER is required'),
  AIVEN_PASSWORD: z.string().trim().min(1, 'AIVEN_PASSWORD is required'),
  AIVEN_SSL_MODE: z.enum(['disable', 'require', 'verify-ca', 'verify-full'], {
    errorMap: () => ({
      message: 'AIVEN_SSL_MODE must be disable, require, verify-ca, or verify-full',
    }),
  }),
  AIVEN_CONNECTION_LIMIT: z.coerce
    .number()
    .int()
    .positive('AIVEN_CONNECTION_LIMIT must be a positive integer'),
  AIVEN_CONNECTION_STRING: z.string().trim().min(1, 'AIVEN_CONNECTION_STRING is required'),
  AIVEN_CA_CERT: z.string().trim().min(1, 'AIVEN_CA_CERT is required for SSL verification'),

  USE_SUPABASE_DOCUMENTS_TABLE: booleanSchema,

  ANON_SCORING_LIMIT: z.coerce
    .number()
    .int()
    .positive('ANON_SCORING_LIMIT must be a positive integer'),

  UPTIME_CHECKS_CLEANUP_ON_START: booleanSchema,

  LOG_LEVEL: z.enum(['info', 'debug', 'warn', 'error'], {
    errorMap: () => ({ message: 'LOG_LEVEL must be info, debug, warn, or error' }),
  }),

  API_AUTH_ENABLED: booleanSchema,
  API_KEY: z.string().trim(),
  STRICT_ENV: booleanSchema,
});

export const envSchema = baseEnvSchema
  .extend({
    NODE_ENV: z
      .enum(['development', 'staged', 'test', 'production'], {
        errorMap: () => ({ message: 'NODE_ENV must be development, staged, test, or production' }),
      })
      .default('development'),
    PORT: z.coerce.number().int().positive('PORT must be a positive integer').default(3001),

    // Supabase defaults
    SUPABASE_PORT: z.coerce
      .number()
      .int()
      .positive('SUPABASE_PORT must be a positive integer')
      .default(5432),
    SUPABASE_CONNECTION_LIMIT: z.coerce
      .number()
      .int()
      .positive('SUPABASE_CONNECTION_LIMIT must be a positive integer')
      .default(20),

    // Aiven defaults
    AIVEN_PORT: z.coerce
      .number()
      .int()
      .positive('AIVEN_PORT must be a positive integer')
      .default(5432),
    AIVEN_CONNECTION_LIMIT: z.coerce
      .number()
      .int()
      .positive('AIVEN_CONNECTION_LIMIT must be a positive integer')
      .default(20),
    AIVEN_SSL_MODE: z
      .enum(['disable', 'require', 'verify-ca', 'verify-full'], {
        errorMap: () => ({
          message: 'AIVEN_SSL_MODE must be disable, require, verify-ca, or verify-full',
        }),
      })
      .default('require'),

    USE_SUPABASE_DOCUMENTS_TABLE: booleanSchema.default(true),

    ANON_SCORING_LIMIT: z.coerce
      .number()
      .int()
      .positive('ANON_SCORING_LIMIT must be a positive integer')
      .default(20),

    UPTIME_CHECKS_CLEANUP_ON_START: booleanSchema.default(true),

    LOG_LEVEL: z
      .enum(['info', 'debug', 'warn', 'error'], {
        errorMap: () => ({ message: 'LOG_LEVEL must be info, debug, warn, or error' }),
      })
      .default('info'),

    API_AUTH_ENABLED: booleanSchema.default(false),
    API_KEY: z.string().trim().default(''),
    STRICT_ENV: booleanSchema.default(false),
  })
  .refine(
    (data) => {
      // If auth is OFF, we don't care what API_KEY is
      if (!data.API_AUTH_ENABLED) return true;

      // If auth is ON, API_KEY MUST exist and be non-empty
      return !!data.API_KEY && data.API_KEY.trim().length > 0;
    },
    {
      message: 'API_KEY is required when API_AUTH_ENABLED is true',
      path: ['API_KEY'],
    },
  );

export const testEnvSchema = baseEnvSchema
  .extend({}) // no defaults – all fields required
  .refine(
    (data) => {
      // If auth is OFF, we don't care what API_KEY is
      if (!data.API_AUTH_ENABLED) return true;

      // If auth is ON, API_KEY MUST exist and be non-empty
      return !!data.API_KEY && data.API_KEY.trim().length > 0;
    },
    {
      message: 'API_KEY is required when API_AUTH_ENABLED is true',
      path: ['API_KEY'],
    },
  );
