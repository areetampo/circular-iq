import { toast } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAssessment,
  getAssessmentById,
  getPublicAssessment,
} from '@/features/assessments/api/assessmentApi';

/**
 * useAssessment
 * Fetches a single saved assessment by id with React Query (private API).
 * @param {string|number} id
 * @param {Object} [options]
 * @returns {Object}
 */
export function useAssessment(id, options = {}) {
  const { enabled = true, placeholderData } = options;

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => getAssessmentById(id),
    enabled: enabled && !!id,
    placeholderData,
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
 * usePublicAssessment
 * Fetches a publicly shared assessment by public id (no authentication).
 * @param {string} publicId
 * @param {Object} [options]
 * @returns {Object}
 */
export function usePublicAssessment(publicId, options = {}) {
  const { enabled = true } = options;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['publicAssessment', publicId],
    queryFn: () => getPublicAssessment(publicId),
    enabled: enabled && !!publicId,
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
 * usePrefetchAssessment
 * Returns a function to prefetch an assessment by id into the React Query cache.
 * @returns {Function}
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
 * useCreateAssessment
 * Mutation hook to create an assessment and invalidate the assessments list cache.
 * @param {Object} options
 * @returns {Object}
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
