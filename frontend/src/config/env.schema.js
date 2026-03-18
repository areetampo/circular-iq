import { z } from 'zod';

// Helper to handle the "string true" vs "boolean true" mess in .env files
const booleanSchema = z.preprocess((val) => val === 'true' || val === true, z.boolean());

export const frontendSchema = z
  .object({
    VITE_FRONTEND_URL: z.string().trim().url('VITE_FRONTEND_URL must be a valid URL'),

    VITE_API_URL: z.string().trim().url('VITE_API_URL must be a valid URL'),

    VITE_SUPABASE_URL: z.string().trim().url('VITE_SUPABASE_URL must be a valid URL'),
    VITE_SUPABASE_ANON_KEY: z.string().trim().min(1, 'Supabase Anon Key is required'),

    MODE: z
      .enum(['development', 'staged', 'test', 'production', 'frontend'], {
        errorMap: () => ({
          message: 'MODE must be development, staged, test, production, or frontend',
        }),
      })
      .default('development')
      .transform((val) => (val === 'frontend' ? 'development' : val)),
    PROD: booleanSchema.default(false),
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
