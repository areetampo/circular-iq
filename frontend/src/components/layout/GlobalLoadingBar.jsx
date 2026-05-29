import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '@/utils/cn';

/**
 * Renders a top-of-viewport progress bar during route changes detected by `useLocation`.
 * It animates from an in-progress width to complete over 500ms, then fades out.
 */
export default function GlobalLoadingBar({ className, ...props }) {
  const location = useLocation();
  // Three phases control mount, progress width, and fade-out timing.
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    setPhase('loading');

    const completeTimer = setTimeout(() => {
      setPhase('done');

      // Wait for the CSS fade-out before removing the progress bar.
      const unmountTimer = setTimeout(() => setPhase('idle'), 400);
      return () => clearTimeout(unmountTimer);
    }, 500);

    return () => clearTimeout(completeTimer);
  }, [location.pathname]);

  if (phase === 'idle') return null;

  return (
    <>
      <style>{`
        @keyframes loading-bar-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div
        {...props}
        role="progressbar"
        aria-label="Page loading"
        aria-valuenow={phase === 'done' ? 100 : 10}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          // Pin to the top edge above sticky navigation and dialogs.
          'fixed top-0 left-0 z-99999',
          // Keep the bar slim enough to avoid shifting page content.
          'h-0.75',
          // Avoid border/shadow artifacts against the viewport edge.
          'border-none shadow-none outline-none',
          // Width animates during loading and opacity handles completion.
          'transition-[width,opacity] duration-500 ease-out',
          'bg-(--color-accent)',
          phase === 'done' ? 'opacity-0' : 'opacity-100',
          className,
        )}
        style={{
          // Hold below full width until the route-change timeout completes.
          width: phase === 'loading' ? '85%' : '100%',
          // Override inherited spacing that could push the fixed bar off the viewport edge.
          margin: 0,
          padding: 0,
          top: 0,
        }}
      >
        {/* Shimmer sweep is decorative and hidden from assistive tech. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.35,
            background: 'linear-gradient(to right, transparent, #fff8f0, transparent)',
            backgroundSize: '200% 100%',
            animation: 'loading-bar-shimmer 1.6s linear infinite',
          }}
        />
      </div>
    </>
  );
}

GlobalLoadingBar.propTypes = {
  /** Additional CSS classes */
  className: PropTypes.string,
};
