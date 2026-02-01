import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Global Loading Bar Component
 * Displays a subtle top progress bar during background refetches (like GitHub/YouTube)
 * Shows when TanStack Query is performing background refetch operations
 */
export default function GlobalLoadingBar() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let progressInterval;
    let loadingCheckInterval;

    // Check if there are any active queries or refetches
    const checkForActiveQueries = () => {
      const cache = queryClient.getQueryCache();

      // Get all queries
      const queries = cache.getAll();

      // Check if any queries are in loading or fetching state
      const hasActiveQueries = queries.some(
        (query) => query.state.fetchStatus === 'fetching' || query.state.status === 'pending',
      );

      setIsLoading(hasActiveQueries);

      // If transitioning to loading, reset progress
      if (hasActiveQueries && progress === 0) {
        setProgress(10);
      }
    };

    // Monitor query cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      checkForActiveQueries();
    });

    // Also periodically check (in case subscription misses something)
    loadingCheckInterval = setInterval(checkForActiveQueries, 100);

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
      if (loadingCheckInterval) clearInterval(loadingCheckInterval);
      unsubscribe();
    };
  }, [queryClient, isLoading, progress]);

  // Don't render if progress is 0
  if (progress === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-lg z-[9999] transition-all duration-500 ease-out"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
      }}
    >
      {/* Animated shimmer effect */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
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
