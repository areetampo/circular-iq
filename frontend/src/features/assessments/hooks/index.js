/**
 * @module assessment.hooks
 * @description Central export point for assessment-related React hooks.
 * Re-exports all assessment hooks for convenient importing.
 *
 * Hooks:
 * - useAssessment: Fetch single assessment by ID
 * - usePublicAssessment: Fetch public assessment by public ID
 * - useCreateAssessment: Create new assessment mutation
 * - usePrefetchAssessment: Prefetch assessment into cache
 * - useAssessments: Fetch paginated assessments list
 * - useAssessmentComparison: Compare two assessments
 * - useAssessmentStats: Fetch assessment statistics
 * - useAssessmentValidation: Validate assessment IDs
 * - useAssessmentValidationSingle: Validate single assessment ID
 * - useGlobalStats: Fetch global statistics
 */

export {
  useAssessment,
  useCreateAssessment,
  usePrefetchAssessment,
  usePublicAssessment,
} from './useAssessment';

export { default as useAssessmentComparison } from './useAssessmentComparison';
export { default as useAssessments } from './useAssessments';
export { default as useAssessmentStats } from './useAssessmentStats';
export { default as useAssessmentValidation } from './useAssessmentValidation';
export { default as useAssessmentValidationSingle } from './useAssessmentValidationSingle';
export { default as useGlobalStats } from './useGlobalStats';
