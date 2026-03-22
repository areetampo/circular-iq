import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 *
 * Handles scroll behavior on page navigation:
 * - Scrolls to top on forward navigation (links, programmatic navigation)
 * - Preserves scroll position on back/forward button navigation
 * - Resets scroll on new route visits
 *
 * This component should be placed high in the component tree,
 * typically in AppProvider or AppRoutes wrapper.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const isPopStateRef = useRef(false);
  const previousPathnameRef = useRef(null);

  // Track popstate events (back/forward button presses)
  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Scroll to top on route changes (but not on popstate)
  useEffect(() => {
    // Skip scroll on initial load
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname;
      return;
    }

    // If the pathname changed
    if (pathname !== previousPathnameRef.current) {
      // Only scroll to top if this isn't a popstate (back/forward button) navigation
      if (!isPopStateRef.current) {
        // Use requestAnimationFrame to ensure the DOM is ready
        window.requestAnimationFrame(() => {
          window.scrollTo(0, 0);
        });
      }

      // Reset the popstate flag after handling
      isPopStateRef.current = false;
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
