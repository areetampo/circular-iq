import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '@/utils/cn';

/**
 * @module GlobalLoadingBar
 * @description Global loading bar component that displays a subtle top progress bar during route changes.
 * Shows a gradient progress bar at the top of the viewport when navigating between pages or on initial load.
 * Uses a shimmer animation effect and automatically hides when loading is complete.
 *
 * Behavior:
 * - Triggers on route changes (detected via useLocation hook)
 * - Shows progress from 10% to 100% over 500ms
 * - Fades out after 300ms delay then unmounts
 * - Includes animated shimmer effect for visual polish
 *
 * Colors: Uses --color-loading-bar* tokens (defined in index.css) — a warm toasted-walnut
 * tone that sits clearly darker than the creamy beige background without harsh contrast.
 *
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element|null} Rendered loading bar or null when not active
 *
 * @example
 * // Placed in AppProvider or root layout
 * <GlobalLoadingBar />
 */
export default function GlobalLoadingBar({ className, ...props }) {
  const location = useLocation();
  // Three phases: 'idle' | 'loading' | 'done'
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    setPhase('loading');

    const completeTimer = setTimeout(() => {
      setPhase('done');

      // After the fade-out transition finishes, unmount
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
          // Pinned to the very top edge of the viewport, above everything
          'fixed top-0 left-0 z-99999',
          // Height — 3px is clean and unobtrusive
          'h-0.75',
          // No shadow, no border — nothing that could produce a white line artefact
          'border-none shadow-none outline-none',
          // Width animates smoothly; opacity fades on done
          'transition-[width,opacity] duration-500 ease-out',
          // Solid warm-brown colour, slightly darker than beige — no gradient needed
          'bg-(--color-accent)',
          phase === 'done' ? 'opacity-0' : 'opacity-100',
          className,
        )}
        style={{
          // Nudge to 85% while loading, sweep to 100% on complete before fade
          width: phase === 'loading' ? '85%' : '100%',
          // Override any margin/padding that could push it down from the top
          margin: 0,
          padding: 0,
          top: 0,
        }}
      >
        {/* Subtle shimmer sweep — purely decorative */}
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
