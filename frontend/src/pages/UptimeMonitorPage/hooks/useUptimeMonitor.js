/**
 * Central hook for the Uptime Monitor page.
 * Manages SSE connection to `/api/uptime/stream`, in-memory check history,
 * reactive HTTP fallback polling when SSE is unavailable, and countdown state
 * for the next expected poll cycle.
 *
 * Data flow:
 * 1. On mount — fetches raw history per endpoint via `fetchHistory`.
 * 2. Opens SSE — appends `poll-complete` results to history and bumps `pollCount`
 *    (chart components watch `pollCount` to refetch aggregated DB endpoints).
 * 3. On SSE error — sets `isUsingFallback`; a `useEffect` starts interval polling.
 * 4. `reconnect()` — manual SSE retry from the page UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { buildApiUrl } from '@/lib/apiClient';

import { ENDPOINTS, MAX_HISTORY_PER_ENDPOINT, REFETCH_INTERVAL_MS } from '../constants';
import { fetchHistory } from '../utils/uptimeHelpers';

/**
 * Uptime monitor state and controls for the page and child chart components.
 *
 * @returns {{
 *   history: Record<string, Array<{ ts: number, up: boolean, ms: number|null, status: string, data: Object }>>,
 *   loadingInitial: boolean,
 *   nextUpdateSeconds: number,
 *   isUsingFallback: boolean,
 *   reconnect: () => void,
 *   isReconnecting: boolean,
 *   dbTotalChecks: number|null,
 *   pollCount: number,
 *   latestPollResults: Array<Object>|null
 * }} Uptime page state, SSE/fallback status, reconnect control, and latest poll payloads.
 */
export function useUptimeMonitor() {
  const [dbTotalChecks, setDbTotalChecks] = useState(null);
  const [history, setHistory] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [nextUpdateSeconds, setNextUpdateSeconds] = useState(REFETCH_INTERVAL_MS / 1000);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [latestPollResults, setLatestPollResults] = useState(null);

  const eventSourceRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const countdownRef = useRef(null);

  /** Clears the HTTP fallback polling interval, if active. */
  const stopFallback = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  /**
   * Fetches full check history for every monitored endpoint in parallel.
   * On failure, enables fallback mode (handled by the `isUsingFallback` effect).
   */
  const loadAllHistory = useCallback(async () => {
    try {
      const results = await Promise.all(
        ENDPOINTS.map(async (ep) => {
          const checks = await fetchHistory(ep.id, MAX_HISTORY_PER_ENDPOINT);
          return { id: ep.id, checks };
        }),
      );

      const newHistory = {};
      results.forEach(({ id, checks }) => {
        newHistory[id] = checks;
      });
      setHistory(newHistory);

      const allTimestamps = Object.values(newHistory).flatMap((checks) =>
        checks.length ? [checks[checks.length - 1].ts] : [],
      );

      if (allTimestamps.length > 0) {
        const mostRecentTs = Math.max(...allTimestamps);
        const secondsSinceLastCheck = Math.floor((Date.now() - mostRecentTs) / 1000);
        const remaining = Math.max(REFETCH_INTERVAL_MS / 1000 - secondsSinceLastCheck, 0);
        setNextUpdateSeconds(remaining);
      }
    } catch (error) {
      logger.error('[UPTIME_MONITOR:HISTORY_LOAD_FAILED]', error);
      setIsUsingFallback(true);
    }
  }, []);

  /** Starts interval polling at `REFETCH_INTERVAL_MS` when SSE is unavailable. */
  const startFallback = useCallback(() => {
    if (fallbackIntervalRef.current) return;
    fallbackIntervalRef.current = setInterval(loadAllHistory, REFETCH_INTERVAL_MS);
  }, [loadAllHistory]);

  /**
   * Opens (or replaces) the SSE connection to `/api/uptime/stream`.
   * Handles `poll-complete` events by merging results into in-memory history.
   *
   * @param {() => void} [onSuccess] - Called when the connection opens successfully.
   * @param {() => void} [onError] - Called when the connection errors or closes.
   */
  const connectSSE = useCallback((onSuccess, onError) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = buildApiUrl('/api/uptime/stream');
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('poll-complete', (event) => {
      const { results } = JSON.parse(event.data);
      setLatestPollResults(results);
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
          updated[r.endpointId] = [...prevChecks, newCheck].slice(-MAX_HISTORY_PER_ENDPOINT);
        }
        return updated;
      });
      setNextUpdateSeconds(REFETCH_INTERVAL_MS / 1000);
      setPollCount((prev) => prev + 1);
    });

    eventSource.onopen = () => {
      setIsUsingFallback(false);
      setIsReconnecting(false);
      if (onSuccess) onSuccess();
    };

    eventSource.onerror = (error) => {
      logger.error('[UPTIME_MONITOR:SSE_CONNECTION_ERROR]', error);
      eventSource.close();
      eventSourceRef.current = null;
      setIsUsingFallback(true);
      setIsReconnecting(false);
      if (onError) onError();
    };
  }, []);

  /** Manually retries the SSE connection (e.g. from the page reconnect button). */
  const reconnect = useCallback(() => {
    // Remove the isUsingFallback check.
    // We only care that we aren't ALREADY in the middle of a reconnection attempt.
    if (!isReconnecting) {
      setIsReconnecting(true);

      // Attempt to connect
      connectSSE(
        () => {
          setIsReconnecting(false);
          setIsUsingFallback(false); // If successful, turn off fallback mode
        },
        () => {
          setIsReconnecting(false);
          setIsUsingFallback(true); // If failed, ensure fallback mode is on
        },
      );
    }
  }, [isReconnecting, connectSSE]);

  /**
   * REACTIVE FALLBACK MANAGEMENT
   * Automatically starts/stops polling when isUsingFallback changes
   */
  useEffect(() => {
    if (isUsingFallback) {
      startFallback();
    } else {
      stopFallback();
    }
    return () => stopFallback();
  }, [isUsingFallback, startFallback, stopFallback]);

  // Initial data load
  useEffect(() => {
    loadAllHistory().finally(() => setLoadingInitial(false));
  }, [loadAllHistory]);

  // SSE setup
  useEffect(() => {
    if (loadingInitial) return;
    connectSSE();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [loadingInitial, connectSSE]);

  // Global stats fetch
  useEffect(() => {
    fetch(buildApiUrl('/api/uptime/count'))
      .then((r) => r.json())
      .then((d) => setDbTotalChecks(d.total))
      .catch(() => {});
  }, []);

  // Countdown timer logic
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
    isUsingFallback,
    reconnect,
    isReconnecting,
    dbTotalChecks,
    pollCount,
    latestPollResults,
  };
}
