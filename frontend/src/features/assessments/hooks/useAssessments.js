import { useCallback, useEffect, useState } from 'react';
import {
  getAssessments as fetchAssessments,
  deleteAssessment,
} from '@/features/assessments/api/assessmentApi';

export function useAssessments({
  sessionId,
  page,
  pageSize,
  sortBy,
  order,
  search,
  industry,
} = {}) {
  const [assessments, setAssessments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAssessments({
        sessionId,
        page,
        pageSize,
        sortBy,
        order,
        search,
        industry,
      });

      setAssessments(data.assessments || []);
      setTotal(Number(data.total || 0));
    } catch (err) {
      setError(err?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [sessionId, page, pageSize, sortBy, order, search, industry]);

  const removeAssessment = useCallback(
    async (id) => {
      const nextDeleting = new Set(deletingIds);
      nextDeleting.add(id);
      setDeletingIds(nextDeleting);

      try {
        await deleteAssessment(id);
        setAssessments((prev) => prev.filter((assessment) => assessment.id !== id));
      } catch (err) {
        setError(err?.message || 'Failed to delete assessment');
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [deletingIds],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    assessments,
    total,
    loading,
    error,
    deletingIds,
    refetch,
    removeAssessment,
  };
}
