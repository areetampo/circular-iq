/**
 * @module useDrawerDirection
 * @description Responsive drawer slide direction based on viewport width.
 * Returns `bottom` at ≤768px (md breakpoint) and `right` on wider screens.
 */

import { useEffect, useState } from 'react';

/**
 * Tracks drawer slide direction across window resize events.
 *
 * @returns {'bottom' | 'right'} Animation direction for the drawer component.
 */
export default function useDrawerDirection(): 'bottom' | 'right' {
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
