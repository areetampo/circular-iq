import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

/**
 * Global Loading Bar Component
 * Displays a subtle top progress bar during background refetches (like GitHub/YouTube)
 * Shows when TanStack Query is performing background refetch operations
 */
export default function GlobalLoadingBar() {
  const queryClient = useQueryClient();
  const isFetchingCount = useIsFetching();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const hasActiveQueries = isFetchingCount > 0;
    setIsLoading(hasActiveQueries);

    if (hasActiveQueries && progress === 0) {
      setProgress(10);
    }
  }, [isFetchingCount, progress]);

  useEffect(() => {
    let progressInterval;
    // Animate progress bar
    if (isLoading && progress < 90) {
      progressInterval = setTimeout(
        () => {
          setProgress((prev) => {
            const increment = Math.random() * 30;
            return Math.min(prev + increment, 90);
          });
        },
        300 + Math.random() * 600,
      ); // Random interval for natural feel
    } else if (!isLoading && progress > 0) {
      // Complete the progress bar
      setProgress(100);
      const resetTimeout = setTimeout(() => setProgress(0), 300);
      return () => clearTimeout(resetTimeout);
    }

    return () => {
      if (progressInterval) clearTimeout(progressInterval);
    };
  }, [isLoading, progress]);

  // Don't render if progress is 0
  if (progress === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-linear-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-lg z-9999 transition-all duration-500 ease-out"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
      }}
    >
      {/* Animated shimmer effect */}
      <div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-30"
        style={{
          animation: 'shimmer 2s infinite',
          backgroundSize: '200% 100%',
        }}
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
