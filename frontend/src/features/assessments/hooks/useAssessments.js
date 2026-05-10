import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteAssessment,
  getAssessmentById,
  getAssessments,
} from '@/features/assessments/api/assessmentApi';

/**
 * useAssessments - Paginated, filtered list of the current user's assessments (React Query)
 * @param {Object} [options={}] - Query options
 * @param {string} [options.sessionId] - Session ID (deprecated, auth handled by token)
 * @param {number|string} [options.page] - Page number
 * @param {number|string} [options.pageSize] - Items per page
 * @param {string} [options.sortBy] - Sort field (created_at, overall_score, title)
 * @param {string} [options.order] - Sort order (asc, desc)
 * @param {string} [options.search] - Search term
 * @param {string} [options.industry] - Industry filter
 * @returns {Object} Query result with assessments data and delete functionality
 */
export default function useAssessments({
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
    staleTime: 30 * 1000, // 30 seconds - ensures fresh data when navigating back
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
    retry: false, // Don't retry on error to prevent repeated toasts for pagination errors
    throwOnError: false, // Don't throw errors globally to prevent toast notifications
  });

  // Use mutation for deleting assessments
  const deleteMutation = useMutation({
    mutationFn: async (deletedId) => {
      logger.log('[MUTATION_START]', { deletedId });
      try {
        const result = await deleteAssessment(deletedId);
        logger.log('[MUTATION_SUCCESS]', { deletedId, result });
        return result;
      } catch (error) {
        logger.error('[MUTATION_FAIL]', {
          deletedId,
          error: error.message,
          stack: error.stack,
          fullError: error,
        });
        throw error;
      }
    },
    onMutate: async (deletedId) => {
      logger.log('[ON_MUTATE]', { deletedId });
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
          logger.log('[OPTIMISTIC_UPDATE]', { deletedId, newTotal: updated.total });
          return updated;
        });
      }

      // Return snapshot as context for potential rollback
      return { previousAssessments, cacheKey };
    },
    onError: (err, deletedId, context) => {
      logger.error('[ON_ERROR]', { deletedId, error: err.message, context });
      // Roll back to the snapshot if the mutation fails
      if (context?.previousAssessments && context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousAssessments);
        logger.log('[ROLLBACK_COMPLETE]', { deletedId });
      }
    },
    onSuccess: (data, deletedId, context) => {
      logger.log('[ON_SUCCESS]', { deletedId, context });

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
