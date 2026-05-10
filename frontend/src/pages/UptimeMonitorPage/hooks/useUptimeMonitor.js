import { useCallback, useEffect, useRef, useState } from 'react';

import { FRONTEND_CONFIG } from '@/config/frontend.config';

import { ENDPOINTS, HISTORY_LIMIT } from '../constants';
import { fetchHistoryFromBackend } from '../utils/uptimeHelpers';

const refetchIntervalMs = FRONTEND_CONFIG.uptimeMonitor.refetchIntervalMs;

export function useUptimeMonitor() {
  const [history, setHistory] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [nextUpdateSeconds, setNextUpdateSeconds] = useState(refetchIntervalMs / 1000);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const loadAllHistory = useCallback(async () => {
    const results = await Promise.all(
      ENDPOINTS.map(async (ep) => {
        const checks = await fetchHistoryFromBackend(ep.id, HISTORY_LIMIT);
        return { id: ep.id, checks };
      }),
    );
    const newHistory = {};
    results.forEach(({ id, checks }) => {
      newHistory[id] = checks;
    });
    setHistory(newHistory);
    setNextUpdateSeconds(refetchIntervalMs / 1000);
  }, []);

  // Initial load
  useEffect(() => {
    loadAllHistory().finally(() => setLoadingInitial(false));
  }, [loadAllHistory]);

  // Periodic refresh (every 30s)
  useEffect(() => {
    if (loadingInitial) return;
    intervalRef.current = setInterval(loadAllHistory, refetchIntervalMs);
    return () => clearInterval(intervalRef.current);
  }, [loadingInitial, loadAllHistory]);

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setNextUpdateSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  return {
    history,
    loadingInitial,
    nextUpdateSeconds,
  };
}
