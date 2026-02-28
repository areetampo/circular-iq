import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staged', 'test', 'production']).default('development'),

    PORT: z.coerce.number().int().positive().default(3001),

    OPENAI_API_KEY: z.string().min(10),

    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(10),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),

    FRONTEND_URL: z.string().url().optional(),
    ALLOWED_ORIGINS: z.string().optional(),
    PUBLIC_ROUTES: z.string().optional(),
    MAX_FREE_TRIES: z.coerce.number().int().positive().default(5),
    LOG_LEVEL: z.enum(['info', 'debug', 'warn', 'error']).default('info'),

    API_AUTH_ENABLED: z
      .preprocess((val) => val === 'true' || val === true, z.boolean())
      .default(false),
    API_KEY: z.string().min(10).optional(),
    STRICT_ENV: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  })
  .refine(
    (data) => {
      // If API_AUTH_ENABLED is true, API_KEY is required with minimum 10 characters
      if (data.API_AUTH_ENABLED && (!data.API_KEY || data.API_KEY.length < 10)) {
        return false;
      }
      return true;
    },
    {
      message: 'API_KEY must be at least 10 characters when API_AUTH_ENABLED is true',
      path: ['API_KEY'],
    },
  );
