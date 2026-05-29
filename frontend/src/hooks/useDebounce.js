import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it stops changing for `delay` milliseconds.
 *
 * @template T
 * @param {T} value - Latest candidate value; the returned value updates after the quiet period.
 * @param {number} [delay=300] - Quiet period in ms before the debounced value updates.
 * @returns {T} Stable value, initially equal to the first `value`.
 */
export default function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
