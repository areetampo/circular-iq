import React, { useState, useEffect, useMemo } from 'react';

const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export default function ResponsiveSizeWrapper({ size = 'md', children }) {
  // 1. Initialize with a sensible default or null to prevent hydration mismatch
  const [currentSize, setCurrentSize] = useState('md');

  // 2. Parse the "sm sm:md md:lg" string into an object
  const sizeMap = useMemo(() => {
    const tokens = size.toString().split(' ');
    const map = { base: tokens[0] };
    tokens.forEach((t) => {
      if (t.includes(':')) {
        const [bp, s] = t.split(':');
        map[bp] = s;
      }
    });
    return map;
  }, [size]);

  useEffect(() => {
    let timeoutId = null;

    const updateSize = () => {
      const width = window.innerWidth;
      let selected = sizeMap.base;

      if (width >= BREAKPOINTS.xs && sizeMap.xs) selected = sizeMap.xs;
      if (width >= BREAKPOINTS.sm && sizeMap.sm) selected = sizeMap.sm;
      if (width >= BREAKPOINTS.md && sizeMap.md) selected = sizeMap.md;
      if (width >= BREAKPOINTS.lg && sizeMap.lg) selected = sizeMap.lg;
      if (width >= BREAKPOINTS.xl && sizeMap.xl) selected = sizeMap.xl;
      if (width >= BREAKPOINTS['2xl'] && sizeMap['2xl']) selected = sizeMap['2xl'];

      setCurrentSize(selected);
    };

    // Debounced resize handler
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 100);
    };

    updateSize(); // Initial call
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [sizeMap]);

  // Inject the calculated size into the child component
  if (!React.isValidElement(children)) return children;

  return React.cloneElement(children, { size: currentSize });
}
