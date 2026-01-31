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

  // Use mutation for deleting assessments with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteAssessment,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['assessments'] });

      // Snapshot the current cache
      const previousAssessments = queryClient.getQueryData([
        'assessments',
        { sessionId, page, pageSize, sortBy, order, search, industry },
      ]);

      // Optimistically update the cache by filtering out the deleted assessment
      if (previousAssessments) {
        queryClient.setQueryData(
          ['assessments', { sessionId, page, pageSize, sortBy, order, search, industry }],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              assessments: old.assessments.filter((assessment) => assessment.id !== deletedId),
              total: Math.max(0, (old.total || 0) - 1),
            };
          },
        );
      }

      // Return snapshot as context for potential rollback
      return { previousAssessments };
    },
    onError: (err, deletedId, context) => {
      // Roll back to the snapshot if the mutation fails
      if (context?.previousAssessments) {
        queryClient.setQueryData(
          ['assessments', { sessionId, page, pageSize, sortBy, order, search, industry }],
          context.previousAssessments,
        );
      }
    },
    onSettled: () => {
      // Invalidate all assessments queries to ensure UI is in sync with server
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
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
