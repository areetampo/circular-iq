import { z } from 'zod';
import { parameterLabels } from '@/constants/evaluationData';

/**
 * Assessment form validation schema
 */
export const assessmentSchema = z.object({
  businessProblem: z.string().min(200, 'Business problem must be at least 200 characters'),
  businessSolution: z.string().min(200, 'Business solution must be at least 200 characters'),
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
};
