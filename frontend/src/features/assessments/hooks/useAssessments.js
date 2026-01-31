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
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assessments', { sessionId, page, pageSize, sortBy, order, search, industry }],
    queryFn: () => getAssessments({
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
    mutationFn: deleteAssessment,
    onSuccess: () => {
      // Invalidate assessments list to trigger automatic refresh
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
