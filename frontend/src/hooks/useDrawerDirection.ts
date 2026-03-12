import { useEffect, useState } from 'react';

/**
 * Returns the vaul `direction` for the global drawer.
 *   "bottom"  — screens < 640px  (<=sm)
 *   "right"   — screens >= 640px (>sm)
 */
export function useDrawerDirection(): 'bottom' | 'right' {
  // Switch from bottom → right at md breakpoint (768px) instead of sm (640px)
  const getDirection = (): 'bottom' | 'right' => (window.innerWidth < 768 ? 'bottom' : 'right');

  const [direction, setDirection] = useState<'bottom' | 'right'>(getDirection);

  useEffect(() => {
    const handler = () => setDirection(getDirection());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return direction;
}
