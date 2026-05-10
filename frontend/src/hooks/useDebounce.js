import { useEffect, useState } from 'react';

/**
 * useDebounce
 * Returns the latest `value` only after it has been stable for `delay` ms.
 * @param {*} value
 * @param {number} [delay=300]
 * @returns {*}
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
