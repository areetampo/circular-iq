import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '@/utils/cn';

/**
 * Global Loading Bar Component
 * Displays a subtle top progress bar during page visits or refreshes
 * Shows when navigating to new pages or on initial page load
 */
export default function GlobalLoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Trigger loading on route change or initial load
    setProgress(10);

    // Simulate loading completion after a short delay
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
      }, 300);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Don't render if progress is 0
  if (progress === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-9999 h-0.75 shadow-lg transition-all duration-500 ease-out',
        'bg-[linear-gradient(to_right,var(--accent),var(--accent-hover),var(--accent))]',
        progress === 100 ? 'opacity-0' : 'opacity-100',
      )}
      style={{
        width: `${progress}%`,
      }}
    >
      {/* Animated shimmer effect */}
      <div
        className={cn(
          'absolute inset-0 opacity-30',
          'bg-[linear-gradient(to_right,transparent,var(--surface),transparent)]',
          'animate-[shimmer_2s_infinite]',
          'bg-size-[200%_100%]',
        )}
      />

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            backgroundPosition: 200% 0;
          }
          100% {
            backgroundPosition: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

GlobalLoadingBar.propTypes = {};
