/**
 * @module useAssessment
 * @description React Query hooks for loading, creating, and mutating saved assessments.
 */

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
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - When false, skips the query
 * @param {*} [options.placeholderData] - React Query placeholder while refetching
 * @returns {{
 *   assessment: Object|null,
 *   loading: boolean,
 *   isLoading: boolean,
 *   error: string|null,
 *   isError: boolean,
 *   refetch: Function,
 *   isPlaceholderData: boolean
 * }}
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
    onError: (err) => {
      // Handle validation errors specifically
      if (err.message?.includes('Validation failed')) {
        const fieldMatch = err.message.match(/`(\w+)`/);
        const fieldName = fieldMatch ? fieldMatch[1] : 'data';
        toast.danger(`Missing or invalid field: ${fieldName}`, {
          description: 'Some assessment data may be incomplete. Displaying available data.',
          timeout: 4000,
        });
      } else {
        toast.danger('Failed to load assessment', {
          description: err.message || 'Please try again',
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
 * @param {Object} [options={}] - Query options
 * @param {boolean} [options.enabled=true] - Whether to enable the query
 * @returns {Object} Query result object
 * @returns {Object|null} returns.assessment - Assessment data or null
 * @returns {boolean} returns.loading - Loading state (legacy)
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {boolean} returns.isError - Error state
 * @returns {string|null} returns.error - Error message or null
 * @returns {Function} returns.refetch - Function to refetch the data
 * @returns {Object} returns.data - Full response data
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
    onError: (err) => {
      toast.danger('Failed to load shared assessment', {
        description:
          err.message || 'This link may be invalid or the assessment is no longer public.',
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
 * Returns a function to prefetch an assessment by id into the React Query cache.
 * Useful for preloading data before navigation (e.g., on hover or link focus).
 *
 * @returns {Function} Prefetch function that takes a publicId parameter
 * @param {string} publicId - Assessment ID to prefetch
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
 * @returns {Object} Mutation result object
 * @returns {Function} returns.createAssessment - Function to create assessment (async callback not returned)
 * @returns {Function} returns.createAssessmentAsync - Function to create assessment (returns Promise)
 * @returns {boolean} returns.isLoading - Loading state (legacy)
 * @returns {boolean} returns.isPending - Loading state
 * @returns {boolean} returns.isError - Error state
 * @returns {boolean} returns.isSuccess - Success state
 * @returns {Error|null} returns.error - Error object or null
 * @returns {Object} returns.data - Created assessment data
 * @returns {Function} returns.reset - Function to reset mutation state
 *
 * @example
 * const { createAssessmentAsync, isLoading, error } = useCreateAssessment();
 * const handleSubmit = async (formData) => {
 *   try {
 *     await createAssessmentAsync(formData);
 *     // Navigate to assessments list
 *   } catch (err) {
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
