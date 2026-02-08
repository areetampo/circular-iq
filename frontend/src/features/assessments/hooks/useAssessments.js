import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAssessments, deleteAssessment } from '@/features/assessments';

export function useAssessments({
  sessionId,
  page,
  pageSize,
  sortBy,
  order,
  search,
  industry,
} = {}) {
  const queryClient = useQueryClient();

  // Use React Query to fetch assessments
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['assessments', { sessionId, page, pageSize, sortBy, order, search, industry }],
    queryFn: () =>
      getAssessments({
        sessionId,
        page,
        pageSize,
        sortBy,
        order,
        search,
        industry,
      }),
  });

  // Use mutation for deleting assessments
  const deleteMutation = useMutation({
    mutationFn: async (deletedId) => {
      console.log('[MUTATION_START]', { deletedId });
      try {
        const result = await deleteAssessment(deletedId);
        console.log('[MUTATION_SUCCESS]', { deletedId, result });
        return result;
      } catch (error) {
        console.error('[MUTATION_FAIL]', {
          deletedId,
          error: error.message,
          stack: error.stack,
          fullError: error,
        });
        throw error;
      }
    },
    onMutate: async (deletedId) => {
      console.log('[ON_MUTATE]', { deletedId });
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['assessments'] });

      // Snapshot the current cache
      const cacheKey = [
        'assessments',
        { sessionId, page, pageSize, sortBy, order, search, industry },
      ];
      const previousAssessments = queryClient.getQueryData(cacheKey);

      // Optimistically update the cache by filtering out the deleted assessment
      if (previousAssessments) {
        queryClient.setQueryData(cacheKey, (old) => {
          if (!old) return old;
          const updated = {
            ...old,
            assessments: old.assessments.filter((assessment) => assessment.id !== deletedId),
            total: Math.max(0, (old.total || 0) - 1),
          };
          console.log('[OPTIMISTIC_UPDATE]', { deletedId, newTotal: updated.total });
          return updated;
        });
      }

      // Return snapshot as context for potential rollback
      return { previousAssessments, cacheKey };
    },
    onError: (err, deletedId, context) => {
      console.error('[ON_ERROR]', { deletedId, error: err.message, context });
      // Roll back to the snapshot if the mutation fails
      if (context?.previousAssessments && context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousAssessments);
        console.log('[ROLLBACK_COMPLETE]', { deletedId });
      }
    },
    onSuccess: (data, deletedId, context) => {
      console.log('[ON_SUCCESS]', { deletedId, context });

      // Always invalidate all assessment queries to ensure UI is in sync
      if (context?.cacheKey) {
        // Invalidate the specific query
        queryClient.invalidateQueries({
          queryKey: context.cacheKey,
          exact: true,
        });
      }

      // Also invalidate all assessment queries with similar structure to catch edge cases
      queryClient.invalidateQueries({
        queryKey: ['assessments'],
        exact: false,
      });
    },
  });

  return {
    assessments: data?.assessments || [],
    total: Number(data?.total || 0),
    loading: isLoading,
    isLoading,
    error: error?.message || null,
    isError,
    refetch,
    removeAssessment: deleteMutation.mutate,
    removeAssessmentAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    data, // Return full data object for flexibility
  };
}
