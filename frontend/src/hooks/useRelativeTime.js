import { useEffect, useState } from 'react';

import { formatRelativeTime } from '@/lib/formatting';

/**
 * Maintains a live relative-time label for the supplied instant.
 * Recomputes immediately when `timestamp` changes, then every second while mounted.
 *
 * @param {number|string|Date} timestamp - Instant accepted by `formatRelativeTime`.
 * @returns {string} Human-readable relative label such as "just now" or "2 minutes ago".
 */
export default function useRelativeTime(timestamp) {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(timestamp));

  useEffect(() => {
    setRelativeTime(formatRelativeTime(timestamp));
  }, [timestamp]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
