import { toast } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createAssessment, getAssessmentById, getPublicAssessment } from '@/features/assessments';

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
 * Hook for fetching a publicly shared assessment (no authentication required)
 * @param {string} publicId - The public ID of the shared assessment
 * @param {Object} options - Query options
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
 * Hook for prefetching assessment data on hover to enable instant navigation
 * @returns {Function} prefetch function that takes an assessment ID
 */
export function usePrefetchAssessment() {
  const queryClient = useQueryClient();

  return (id) => {
    if (!id) return;

    queryClient.prefetchQuery({
      queryKey: ['assessment', id],
      queryFn: () => getAssessmentById(id),
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes - ensures hover-to-click transition is instant
    });
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
