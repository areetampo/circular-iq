/**
 * @module useAssessmentValidationSingle
 * @description React hook for validating a single assessment ID.
 * Checks if the ID is valid and publicly accessible with proper error handling.
 */

import { useQuery } from '@tanstack/react-query';

import { validateAssessmentId } from '@/features/assessments/api/assessmentApi';

/**
 * Hook for validating a single assessment ID with proper error handling.
 * Checks if the ID is valid and publicly accessible.
 *
 * @param {string} publicId - Assessment public ID to validate
 * @returns {Object} Validation query state and validate function
 * @returns {Object} returns.validationQuery - React Query result object
 * @returns {boolean} returns.isLoading - Validation loading state
 * @returns {Error|null} returns.error - Validation error or null
 * @returns {Function} returns.validate - Function to trigger validation
 *
 * @example
 * const { validationQuery, isLoading, error, validate } = useAssessmentValidationSingle(publicId);
 * await validate();
 * if (validationQuery.data?.valid) {
 *   // ID is valid
 * }
 */
export default function useAssessmentValidationSingle(publicId) {
  const validationQuery = useQuery({
    queryKey: ['assessmentValidationSingle', publicId],
    queryFn: async () => validateAssessmentId(publicId),
    enabled: !!publicId,
    retry: 1,
    staleTime: 10 * 1000, // 10 seconds - refetch for public/private state changes
    gcTime: 60 * 1000, // 1 minute garbage collection
  });

  return {
    validationQuery,
    isLoading: validationQuery.isLoading,
    error: validationQuery.error,
    validate: async () => {
      try {
        await validationQuery.refetch();
      } catch (error) {
        // Error is already handled by the query state
        logger.error('Validation failed:', error);
      }
    },
  };
}
