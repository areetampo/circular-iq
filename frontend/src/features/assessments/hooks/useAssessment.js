import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssessmentById, createAssessment } from '@/features/assessments';

export function useAssessment(id, options = {}) {
  const { enabled = true } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => getAssessmentById(id),
    enabled: enabled && !!id,
  });

  return {
    assessment: data?.assessment ?? data ?? null,
    loading: isLoading,
    isLoading,
    error: error?.message || null,
    isError,
    refetch,
    data,
  };
}

/**
 * Hook for creating a new assessment with automatic cache invalidation
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createAssessment,
    onSuccess: () => {
      // Invalidate assessments list to trigger automatic refresh
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  return {
    createAssessment: mutation.mutate,
    createAssessmentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
