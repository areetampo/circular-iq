import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const [deletingIds, setDeletingIds] = useState(new Set());

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

  const removeAssessment = useCallback(
    async (id) => {
      const nextDeleting = new Set(deletingIds);
      nextDeleting.add(id);
      setDeletingIds(nextDeleting);

      try {
        await deleteAssessment(id);
        // Refetch assessments after successful deletion
        await refetch();
      } catch (err) {
        // Error is handled by the component
        throw err;
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [deletingIds, refetch],
  );

  return {
    assessments: data?.assessments || [],
    total: Number(data?.total || 0),
    loading: isLoading,
    isLoading,
    error: error?.message || null,
    isError,
    deletingIds,
    refetch,
    removeAssessment,
    data, // Return full data object for flexibility
  };
}
