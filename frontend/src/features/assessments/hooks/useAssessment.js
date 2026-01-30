import { useCallback, useEffect, useState } from 'react';
import { getAssessmentById as fetchAssessmentById } from '@/features/assessments/api/assessmentApi';

export function useAssessment(id, options = {}) {
  const { autoFetch = true, initialData = null } = options;
  const [assessment, setAssessment] = useState(initialData);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setAssessment(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAssessmentById(id);
      setAssessment(data?.assessment ?? data);
    } catch (err) {
      setError(err?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return {
    assessment,
    loading,
    error,
    refetch,
  };
}
