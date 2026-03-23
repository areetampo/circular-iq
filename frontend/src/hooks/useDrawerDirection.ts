import { useEffect, useState } from 'react';

/**
 * useDrawerDirection
 * Returns drawer slide direction (`bottom` on narrow viewports, `right` on wider).
 * @param {Object} options
 * @returns {'bottom' | 'right'}
 */
export function useDrawerDirection(): 'bottom' | 'right' {
  // Switch from bottom → right at md breakpoint (768px) instead of sm (640px)
  const getDirection = (): 'bottom' | 'right' => (window.innerWidth <= 768 ? 'bottom' : 'right');

  const [direction, setDirection] = useState<'bottom' | 'right'>(getDirection);

  useEffect(() => {
    const handler = () => setDirection(getDirection());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return direction;
}
