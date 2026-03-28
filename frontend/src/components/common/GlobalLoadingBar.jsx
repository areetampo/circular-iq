import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global Loading Bar Component
 * Displays a subtle top progress bar during page visits or refreshes
 * Shows when navigating to new pages or on initial page load
 */
export default function GlobalLoadingBar() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Trigger loading on route change or initial load
    setIsLoading(true);
    setProgress(10);

    // Simulate loading completion after a short delay
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
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
      className="fixed top-0 left-0 h-0.75 shadow-lg z-9999 transition-all duration-500 ease-out"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
        background: 'linear-gradient(to right, var(--accent), var(--surface), var(--accent))',
      }}
    >
      {/* Animated shimmer effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(to right, transparent, var(--surface), transparent)',
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

GlobalLoadingBar.propTypes = {};
