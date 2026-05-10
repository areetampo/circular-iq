import { z } from 'zod';

import { getCharacterCount } from '@/lib/validation';
import { dominantCharRatio, nonLetterDensity, uniqueWordRatio } from '@/utils/formHelpers';

/**
 * Evaluation form validation schema
 */
export const evaluationFormSchema = z.object({
  businessProblem: z
    .string()
    .refine((val) => getCharacterCount(val) >= 200, {
      message: 'Business problem must be at least 200 characters (excluding spaces)',
    })
    .refine((val) => uniqueWordRatio(val) >= 0.3, {
      message: 'Problem appears repetitive - please add more specific details',
    })
    .refine((val) => nonLetterDensity(val) <= 0.25, {
      message: 'Problem contains too many special characters',
    })
    .refine((val) => dominantCharRatio(val) <= 0.5, {
      message: 'Problem appears to have repetitive character patterns',
    })
    .refine(
      (val) =>
        !/^[a-z]{1,3}$/i.test(val) &&
        !/^-{3,}$/.test(val) &&
        !/^x{3,}$/.test(val) &&
        !/^(test|lorem|ipsum)/i.test(val),
      {
        message: 'Please provide meaningful business problem description',
      },
    ),
  businessSolution: z
    .string()
    .refine((val) => getCharacterCount(val) >= 200, {
      message: 'Business solution must be at least 200 characters (excluding spaces)',
    })
    .refine((val) => uniqueWordRatio(val) >= 0.3, {
      message: 'Solution appears repetitive - please add more specific details',
    })
    .refine((val) => dominantCharRatio(val) <= 0.5, {
      message: 'Solution appears to have repetitive character patterns',
    })
    .refine((val) => nonLetterDensity(val) <= 0.25, {
      message: 'Solution contains too many special characters',
    })
    .refine(
      (val) =>
        !/^[a-z]{1,3}$/i.test(val) &&
        !/^-{3,}$/.test(val) &&
        !/^x{3,}$/.test(val) &&
        !/^(test|lorem|ipsum)/i.test(val),
      {
        message: 'Please provide meaningful business solution description',
      },
    ),
  evaluationParameters: z.object({
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
 * Default values for evaluation form
 */
export const evaluationFormDefaults = {
  businessProblem: '',
  businessSolution: '',
  evaluationParameters: {
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
    business_model_type: null,
    operational_stage: null,
    target_geography: null,
    annual_volume_estimate: null,
    material_complexity: null,
    has_existing_partnerships: null,
  },
};
