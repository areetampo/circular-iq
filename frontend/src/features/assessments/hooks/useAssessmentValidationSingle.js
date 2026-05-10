import { useQuery } from '@tanstack/react-query';

import { validateAssessmentId } from '@/features/assessments/api/assessmentApi';

/**
 * Hook for validating a single assessment ID with proper error handling
 * Returns validation state and error handling functions
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
