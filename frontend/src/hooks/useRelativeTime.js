import { useEffect, useState } from 'react';

import { formatRelativeTime } from '@/lib/formatting';

/**
 * useRelativeTime
 * Hook that provides real-time relative time formatting
 * @param {number|string|Date} timestamp - The timestamp to format
 * @returns {string} The formatted relative time string
 */
export function useRelativeTime(timestamp) {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(timestamp));

  // Update immediately when timestamp changes (no delay)
  useEffect(() => {
    setRelativeTime(formatRelativeTime(timestamp));
  }, [timestamp]);

  // Then keep updating every second for real‑time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
