import { toast } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAssessment,
  getAssessmentById,
  getPublicAssessment,
} from '@/features/assessments/api/assessmentApi';

/**
 * Fetches a single saved assessment by id (authenticated API).
 *
 * @param {string|number} id - Assessment public id
 * @param {{ enabled?: boolean, placeholderData?: unknown }} [options] - React Query options for enabling and placeholder behavior.
 * @param {boolean} [options.enabled=true] - When false, skips the query
 * @param {unknown} [options.placeholderData] - React Query placeholder while refetching.
 * @returns {{
 *   assessment: Record<string, unknown>|null,
 *   loading: boolean,
 *   isLoading: boolean,
 *   error: string|null,
 *   isError: boolean,
 *   refetch: import('@tanstack/react-query').UseQueryResult['refetch'],
 *   data: Record<string, unknown>|undefined,
 *   isPlaceholderData: boolean
 * }} Saved assessment record plus React Query state and placeholder status.
 */
export function useAssessment(id, options = {}) {
  const { enabled = true, placeholderData } = options;

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => getAssessmentById(id),
    enabled: enabled && !!id,
    placeholderData,
    staleTime: 30 * 1000, // 30 seconds - ensures fresh data when navigating back
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
    onError: (error) => {
      // Handle validation errors specifically
      if (error.message?.includes('Validation failed')) {
        const fieldMatch = error.message.match(/`(\w+)`/);
        const fieldName = fieldMatch ? fieldMatch[1] : 'data';
        toast.danger(`Missing or invalid field: ${fieldName}`, {
          description: 'Some assessment data may be incomplete. Displaying available data.',
          timeout: 4000,
        });
      } else {
        toast.danger('Failed to load assessment', {
          description: error.message || 'Please try again',
          timeout: 4000,
        });
      }
    },
  });

  return {
    assessment: data?.assessment ?? data ?? null,
    loading: isLoading,
    isLoading,
    error: error?.message || null,
    isError,
    refetch,
    data,
    isPlaceholderData, // Expose to components for subtle loading indicators
  };
}

/**
 * Fetches a publicly shared assessment by public id (no authentication required).
 * Uses optional authentication for ownership check but works without it.
 *
 * @param {string} publicId - Public assessment ID to fetch
 * @param {{ enabled?: boolean }} [options={}] - Query options.
 * @param {boolean} [options.enabled=true] - Whether to enable the query
 * @returns {{
 *   assessment: Record<string, unknown>|null,
 *   loading: boolean,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: string|null,
 *   refetch: import('@tanstack/react-query').UseQueryResult['refetch'],
 *   data: Record<string, unknown>|undefined
 * }} Public assessment record plus React Query state.
 *
 * @example
 * const { assessment, isLoading, error } = usePublicAssessment('abc-123');
 * if (isLoading) return <Loader />;
 * if (error) return <Error message={error} />;
 * return <PublicAssessmentView assessment={assessment} />;
 */
export function usePublicAssessment(publicId, options = {}) {
  const { enabled = true } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['publicAssessment', publicId],
    queryFn: () => getPublicAssessment(publicId),
    enabled: enabled && !!publicId,
    staleTime: 30 * 1000, // 30 seconds - ensures fresh data when navigating back
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
    onError: (error) => {
      toast.danger('Failed to load shared assessment', {
        description:
          error.message || 'This link may be invalid or the assessment is no longer public.',
        timeout: 4000,
      });
    },
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
 * Returns a stable prefetcher for warming the assessment detail query cache.
 * No-ops when called without a public id.
 *
 * @returns {(publicId: string) => void} Callback that prefetches a saved assessment by public id.
 *
 * @example
 * const prefetchAssessment = usePrefetchAssessment();
 * <Link
 *   onMouseEnter={() => prefetchAssessment(assessment.id)}
 *   to={`/assessments/${assessment.id}`}
 * >
 *   {assessment.title}
 * </Link>
 */
export function usePrefetchAssessment() {
  const queryClient = useQueryClient();

  return (publicId) => {
    if (!publicId) return;

    queryClient.prefetchQuery({
      queryKey: ['assessment', publicId],
      queryFn: () => getAssessmentById(publicId),
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes - ensures hover-to-click transition is instant
    });
  };
}

/**
 * Mutation hook to create an assessment and invalidate the assessments list cache.
 * Automatically refreshes the assessments list after successful creation.
 *
 * @returns {{
 *   createAssessment: import('@tanstack/react-query').UseMutateFunction,
 *   createAssessmentAsync: import('@tanstack/react-query').UseMutateAsyncFunction,
 *   isLoading: boolean,
 *   isPending: boolean,
 *   isError: boolean,
 *   isSuccess: boolean,
 *   error: Error|null,
 *   data: Record<string, unknown>|undefined,
 *   reset: () => void
 * }} Create mutation methods and mutation state for assessment saves.
 *
 * @example
 * const { createAssessmentAsync, isLoading, error } = useCreateAssessment();
 * const handleSubmit = async (formData) => {
 *   try {
 *     await createAssessmentAsync(formData);
 *     // Navigate to assessments list
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
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
