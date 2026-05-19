/**
 * @module useDebounce
 * @description Custom hook for debouncing values.
 * Returns the latest `value` only after it has been stable for `delay` ms.
 * Useful for search inputs, auto-save, and other performance optimizations.
 */

import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it stops changing for `delay` milliseconds.
 *
 * @param {*} value - The value to debounce (any serialisable type).
 * @param {number} [delay=300] - Quiet period in ms before the debounced value updates.
 * @returns {*} The debounced value (initially equal to the first `value`).
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
