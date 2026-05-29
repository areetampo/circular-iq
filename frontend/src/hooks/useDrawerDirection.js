import { useEffect, useState } from 'react';

/**
 * Tracks the drawer slide direction from the current viewport width.
 * Subscribes to `resize` events and switches to `bottom` at widths of 768px or below.
 *
 * @returns {'bottom' | 'right'} Drawer placement for the current viewport width.
 */
export default function useDrawerDirection() {
  // Keep this aligned with the CSS md breakpoint used by drawer layouts.
  const getDirection = () => (window.innerWidth <= 768 ? 'bottom' : 'right');

  const [direction, setDirection] = useState(getDirection);

  useEffect(() => {
    const handler = () => setDirection(getDirection());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return direction;
}
