import { useQuery } from '@tanstack/react-query';

import { validateAssessmentId } from '@/features/assessments/api/assessmentApi';

/**
 * React Query pre-check that a public assessment id exists and is accessible.
 *
 * @param {string} publicId - Public assessment id to validate before navigation/comparison.
 * @returns {{
 *   validationQuery: import('@tanstack/react-query').UseQueryResult,
 *   isLoading: boolean,
 *   error: Error|null,
 *   validate: () => Promise<void>
 * }} React Query validation state plus a manual validation trigger.
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
        logger.error('[ASSESSMENT_VALIDATION_SINGLE:REFETCH_FAILED]', error);
      }
    },
  };
}
