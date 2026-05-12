import { useCallback, useEffect, useRef, useState } from 'react';

import { FRONTEND_CONFIG } from '@/config/frontend.config';
import { buildApiUrl } from '@/lib/apiClient';

import { ENDPOINTS, HISTORY_LIMIT } from '../constants';
import { fetchHistoryFromBackend } from '../utils/uptimeHelpers';

const refetchIntervalMs = FRONTEND_CONFIG.uptimeMonitor.refetchIntervalMs;

export function useUptimeMonitor() {
  const [history, setHistory] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [nextUpdateSeconds, setNextUpdateSeconds] = useState(refetchIntervalMs / 1000);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const eventSourceRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
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
    const mostRecentTs = Math.max(
      ...Object.values(newHistory).flatMap((checks) =>
        checks.length ? [checks[checks.length - 1].ts] : [],
      ),
    );
    const secondsSinceLastCheck = Math.floor((Date.now() - mostRecentTs) / 1000);
    const remaining = Math.max(refetchIntervalMs / 1000 - secondsSinceLastCheck, 0);
    setNextUpdateSeconds(remaining);
  }, []);

  const stopFallback = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const startFallback = useCallback(() => {
    if (fallbackIntervalRef.current) return;
    fallbackIntervalRef.current = setInterval(loadAllHistory, refetchIntervalMs);
  }, [loadAllHistory]);

  const connectSSE = useCallback(
    (onSuccess, onError) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const sseUrl = buildApiUrl('/api/uptime/stream');
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('poll-complete', (event) => {
        const { results } = JSON.parse(event.data);
        setHistory((prev) => {
          const updated = { ...prev };
          for (const r of results) {
            const newCheck = {
              ts: Date.now(),
              up: r.up,
              ms: r.responseTimeMs,
              status: r.status,
              data: null,
            };
            const prevChecks = updated[r.endpointId] || [];
            updated[r.endpointId] = [...prevChecks, newCheck].slice(-HISTORY_LIMIT);
          }
          return updated;
        });
        setNextUpdateSeconds(refetchIntervalMs / 1000);
      });

      eventSource.addEventListener('connected', () => {
        logger.info('[SSE] Connection established');
      });

      eventSource.onopen = () => {
        setIsUsingFallback(false);
        stopFallback();
        setIsReconnecting(false);
        if (onSuccess) onSuccess();
      };

      eventSource.onerror = (err) => {
        logger.warn('SSE connection error', err);
        eventSource.close();
        eventSourceRef.current = null;
        setIsUsingFallback(true);
        stopFallback();
        startFallback();
        setIsReconnecting(false);
        if (onError) onError();
      };
    },
    [stopFallback, startFallback],
  );

  const reconnect = useCallback(() => {
    if (isUsingFallback && !isReconnecting) {
      setIsReconnecting(true);
      stopFallback();
      connectSSE(
        () => setIsReconnecting(false),
        () => setIsReconnecting(false),
      );
    }
  }, [isUsingFallback, isReconnecting, stopFallback, connectSSE]);

  // Initial load
  useEffect(() => {
    loadAllHistory().finally(() => setLoadingInitial(false));
  }, [loadAllHistory]);

  // Set up SSE after initial load
  useEffect(() => {
    if (loadingInitial) return;
    connectSSE();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      stopFallback();
    };
  }, [loadingInitial]);

  // Countdown timer (reset by SSE events)
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setNextUpdateSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  return { history, loadingInitial, nextUpdateSeconds, isUsingFallback, reconnect, isReconnecting };
}
