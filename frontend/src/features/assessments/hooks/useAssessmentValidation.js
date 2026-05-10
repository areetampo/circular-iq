import { useQuery } from '@tanstack/react-query';

import { validateAssessmentIds } from '@/features/assessments/api/assessmentApi';

/**
 * Hook for validating assessment IDs with proper error handling
 * Returns validation state and error handling functions
 */
export default function useAssessmentValidation(id1, id2) {
  const validationQuery = useQuery({
    queryKey: ['assessmentValidation', id1, id2],
    queryFn: async () => validateAssessmentIds(id1, id2),
    enabled: !!(id1 && id2),
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
