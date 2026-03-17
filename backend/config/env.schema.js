import { z } from 'zod';

// Helper to handle the "string true" vs "boolean true" mess in .env files
const booleanSchema = z.preprocess((val) => val === 'true' || val === true, z.boolean());

// Transforms "a, b, c" into ["a", "b", "c"] automatically
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

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'staged', 'test', 'production'], {
        errorMap: () => ({ message: 'NODE_ENV must be development, staged, test, or production' }),
      })
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3001),

    FRONTEND_URL: z.string().trim().url('A valid FRONTEND_URL is required for CORS and Auth'),
    ALLOWED_ORIGINS: commaSeparatedStringArraySchema,
    PUBLIC_ROUTES: commaSeparatedStringArraySchema,

    OPENAI_API_KEY: z.string().trim().min(1, 'OpenAI API Key is required'),

    SUPABASE_URL: z.string().trim().url('Invalid SUPABASE_URL format'),
    SUPABASE_ANON_KEY: z.string().trim().min(1, 'SUPABASE_ANON_KEY is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

    // optional raw database connection details (used only in special cases)
    SUPABASE_HOST: z.string().trim().optional(),
    SUPABASE_PORT: z.coerce.number().int().positive().optional(),
    SUPABASE_DATABASE: z.string().trim().optional(),
    SUPABASE_USER: z.string().trim().optional(),
    SUPABASE_PASSWORD: z.string().trim().optional(),
    SUPABASE_CONNECTION_LIMIT: z.coerce
      .number()
      .int()
      .positive('SUPABASE_CONNECTION_LIMIT must be a positive integer')
      .default(20),
    SUPABASE_CONNECTION_STRING: z.string().trim().optional(),

    AIVEN_HOST: z.string().trim().min(1, 'AIVEN_HOST is required'),
    AIVEN_PORT: z.coerce.number().int().positive().default(5432),
    AIVEN_DATABASE: z.string().trim().min(1, 'AIVEN_DATABASE is required'),
    AIVEN_USER: z.string().trim().min(1, 'AIVEN_USER is required'),
    AIVEN_PASSWORD: z.string().trim().min(1, 'AIVEN_PASSWORD is required'),
    AIVEN_SSL_MODE: z.enum(['disable', 'require', 'verify-ca', 'verify-full']).default('require'),
    AIVEN_CONNECTION_LIMIT: z.coerce
      .number()
      .int()
      .positive('AIVEN_CONNECTION_LIMIT must be a positive integer')
      .default(20),
    AIVEN_CONNECTION_STRING: z.string().trim().optional(),
    AIVEN_CA_CERT: z.string().trim().optional(),

    USE_SUPABASE_DOCUMENTS_TABLE: booleanSchema.default(true),

    MAX_FREE_TRIES: z.coerce.number().int().positive().default(5),

    LOG_LEVEL: z.enum(['info', 'debug', 'warn', 'error']).default('info'),

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
