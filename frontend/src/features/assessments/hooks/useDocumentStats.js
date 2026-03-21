import { useEffect, useState } from 'react';

import apiClient from '@/lib/apiClient';

export function useDocumentStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get('/api/analytics/documents/summary');
        if (!canceled) setStats(res.data);
      } catch (err) {
        if (!canceled) setError(err?.message || 'Failed to load document stats');
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      canceled = true;
    };
  }, []);

  return { stats, loading, error };
}
