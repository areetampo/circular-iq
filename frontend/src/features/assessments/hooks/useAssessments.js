import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteAssessment,
  getAssessmentById,
  getAssessments,
} from '@/features/assessments/api/assessmentApi';

/**
 * React Query paginated assessments list with optimistic delete; supports session-scoped anonymous lists.
 *
 * @param {{ sessionId?: string, page?: number, pageSize?: number, sortBy?: string, order?: 'asc'|'desc', search?: string, industry?: string }} [options] - Query, pagination, and session options for the assessment list.
 * @param {string} [options.sessionId] - Anonymous session id for unauthenticated lists.
 * @param {number} [options.page] - Page number (1-based).
 * @param {number} [options.pageSize] - Items per page.
 * @param {string} [options.sortBy] - Sort field name.
 * @param {'asc'|'desc'} [options.order] - Sort direction.
 * @param {string} [options.search] - Name search filter.
 * @param {string} [options.industry] - Industry filter.
 * @returns {{
 *   assessments: Array<Record<string, unknown>>,
 *   total: number,
 *   loading: boolean,
 *   isLoading: boolean,
 *   error: string|null,
 *   isError: boolean,
 *   refetch: import('@tanstack/react-query').UseQueryResult['refetch'],
 *   removeAssessment: import('@tanstack/react-query').UseMutateFunction,
 *   removeAssessmentAsync: import('@tanstack/react-query').UseMutateAsyncFunction,
 *   isDeleting: boolean,
 *   deleteError: Error|null,
 *   prefetchAssessment: (id: string) => void,
 *   data: { assessments?: Array<Record<string, unknown>>, total?: number }|undefined
 * }} Assessment list data, delete mutation helpers, cache prefetcher, and query state.
 */
export default function useAssessments(options = {}) {
  const { sessionId, page, pageSize, sortBy, order, search, industry } = options;

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
    staleTime: 30 * 1000, // 30 seconds - ensures fresh data when navigating back
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
    retry: false, // Don't retry on error to prevent repeated toasts for pagination errors
    throwOnError: false, // Don't throw errors globally to prevent toast notifications
  });

  // Use mutation for deleting assessments
  const deleteMutation = useMutation({
    mutationFn: async (deletedId) => {
      try {
        const result = await deleteAssessment(deletedId);
        return result;
      } catch (error) {
        logger.error('[ASSESSMENTS:DELETE_FAILED]', { deletedId, error: error.message });
        throw error;
      }
    },
    onMutate: async (deletedId) => {
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
          return updated;
        });
      }

      // Return snapshot as context for potential rollback
      return { previousAssessments, cacheKey };
    },
    onError: (error, deletedId, context) => {
      logger.error('[ASSESSMENTS:DELETE_ROLLBACK]', { deletedId, error: error.message });
      // Roll back to the snapshot if the mutation fails
      if (context?.previousAssessments && context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousAssessments);
      }
    },
    onSuccess: (data, deletedId, context) => {
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

  // Prefetch individual assessments for better UX
  const prefetchAssessment = (assessmentId) => {
    if (!assessmentId) return;
    queryClient.prefetchQuery({
      queryKey: ['assessment', assessmentId],
      queryFn: () => getAssessmentById(assessmentId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

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
    prefetchAssessment, // Add prefetch function
    data, // Return full data object for flexibility
  };
}
