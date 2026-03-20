import { z } from 'zod';

import { getCharacterCount } from '@/lib/validation';

/**
 * Assessment form validation schema
 */
export const assessmentSchema = z.object({
  businessProblem: z.string().refine((val) => getCharacterCount(val) >= 200, {
    message: 'Business problem must be at least 200 characters',
  }),
  businessSolution: z.string().refine((val) => getCharacterCount(val) >= 200, {
    message: 'Business solution must be at least 200 characters',
  }),
  parameters: z.object({
    public_participation: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
    infrastructure: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
    market_price: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
    maintenance: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
    uniqueness: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
    size_efficiency: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
    chemical_safety: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
    tech_readiness: z
      .number()
      .min(0, 'Value must be between 0 and 100')
      .max(100, 'Value must be between 0 and 100'),
  }),
  businessContext: z
    .object({
      business_model_type: z
        .enum([
          'product-as-a-service',
          'take-back',
          'remanufacturing',
          'sharing-platform',
          'repair-service',
          'recycling',
          'other',
        ])
        .optional(),
      operational_stage: z.enum(['idea', 'prototype', 'pilot', 'scaling', 'mature']).optional(),
      target_geography: z.enum(['local', 'national', 'regional', 'global']).optional(),
      annual_volume_estimate: z
        .enum([
          'under-1-tonne',
          '1-10-tonnes',
          '10-100-tonnes',
          'over-100-tonnes',
          'digital-intangible',
        ])
        .optional(),
      material_complexity: z
        .enum([
          'single-material',
          'multi-material',
          'hazardous-components',
          'electronics',
          'biological',
        ])
        .optional(),
      has_existing_partnerships: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Default values for assessment form
 */
export const defaultValues = {
  businessProblem: '',
  businessSolution: '',
  parameters: {
    public_participation: 50,
    infrastructure: 50,
    market_price: 50,
    maintenance: 50,
    uniqueness: 50,
    size_efficiency: 50,
    chemical_safety: 50,
    tech_readiness: 50,
  },
  businessContext: {
    business_model_type: undefined,
    operational_stage: undefined,
    target_geography: undefined,
    annual_volume_estimate: undefined,
    material_complexity: undefined,
    has_existing_partnerships: undefined,
  },
};
