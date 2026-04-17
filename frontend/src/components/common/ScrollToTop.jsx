import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { FRONTEND_CONFIG } from '@/config/frontend.config';

/**
 * ScrollToTop Component
 *
 * Enhanced scroll behavior per UI-123:
 * - New results always start at top when navigating from landing page
 * - Preserves scroll position for previously visited routes during back/forward navigation
 * - Scroll position memory resets after 3 minutes of inactivity
 * - First-time visits to routes start at top, subsequent visits respect previous position
 *
 * This component should be placed high in the component tree,
 * typically in AppProvider or AppRoutes wrapper.
 */
export default function ScrollToTop() {
  console.log('ScrollToTop: === COMPONENT RENDER ===');
  const { pathname, state } = useLocation();
  const isPopStateRef = useRef(false);
  const previousPathnameRef = useRef(null);
  const lastResultIdRef = useRef(null);
  const scrollMemoryRef = useRef(new Map()); // pathname -> { scrollY, timestamp }
  const cleanupTimeoutRef = useRef(null);

  // Add a render counter to track component updates
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log(`ScrollToTop: Render #${renderCountRef.current}`);
  console.log('ScrollToTop: Current pathname:', pathname);
  console.log('ScrollToTop: Current state:', state);
  console.log('ScrollToTop: State keys:', state ? Object.keys(state) : 'no state');
  console.log('ScrollToTop: Has result in state:', !!state?.result);
  console.log(
    'ScrollToTop: Result sample:',
    state?.result
      ? {
          hasOverallScore: !!state.result.overall_score,
          hasProcessingInfo: !!state.result.processing_info,
          score: state.result.overall_score,
          keys: Object.keys(state.result),
        }
      : 'no result',
  );

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

  // Generate a unique identifier for results to detect new vs existing
  const getResultId = (result) => {
    console.log('ScrollToTop: getResultId called with result:', result);

    if (!result) {
      console.log('ScrollToTop: No result provided');
      return null;
    }

    // Handle the case where result might be nested (result.result)
    const actualResult = result?.result || result;
    console.log('ScrollToTop: Using actualResult:', actualResult);

    // For /results page, use request_id from processing_info
    if (actualResult?.processing_info?.request_id) {
      console.log(
        'ScrollToTop: Using processing_info.request_id:',
        actualResult.processing_info.request_id,
      );
      return actualResult.processing_info.request_id;
    }

    // For saved assessments (/assessments/id), try other possible unique identifiers
    const possibleIds = [
      actualResult?.id,
      actualResult?.public_id,
      actualResult?.assessment?.id,
      actualResult?.assessment?.public_id,
    ];

    for (const id of possibleIds) {
      if (id) {
        console.log('ScrollToTop: Using fallback ID:', id);
        return id;
      }
    }

    // Enhanced fallback: generate a stable hash from result content
    const score = actualResult?.overall_score || 0;
    const problemHash = actualResult?.business_problem
      ? actualResult.business_problem.slice(0, 100).replace(/\s+/g, '').trim()
      : '';
    const solutionHash = actualResult?.business_solution
      ? actualResult.business_solution.slice(0, 100).replace(/\s+/g, '').trim()
      : '';
    const categoryScores = actualResult?.category_scores
      ? JSON.stringify(actualResult.category_scores)
      : '';
    const confidence = actualResult?.confidence_level || 0;

    // Create a stable hash from the actual result content
    const contentHash = `${score}_${confidence}_${problemHash}_${solutionHash}_${categoryScores}`;
    console.log('ScrollToTop: Using stable content hash ID:', contentHash);
    return contentHash;
  };

  // Track scroll position changes and store them in memory
  useEffect(() => {
    const handleScroll = () => {
      const currentPath = window.location.pathname;
      const scrollY = window.scrollY;

      // Only store scroll position if user has scrolled down significantly
      if (scrollY > 50) {
        scrollMemoryRef.current.set(currentPath, {
          scrollY,
          timestamp: Date.now(),
        });

        // Clear any existing cleanup timeout
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
        }

        // Set cleanup timeout to expire scroll memory after 3 minutes
        cleanupTimeoutRef.current = setTimeout(
          () => {
            const now = Date.now();
            for (const [path, memory] of scrollMemoryRef.current.entries()) {
              if (now - memory.timestamp >= 3 * 60 * 1000) {
                scrollMemoryRef.current.delete(path);
              }
            }
          },
          3 * 60 * 1000,
        );
      }
    };

    // Throttle scroll events to avoid excessive updates
    let scrollTimeout;
    const throttledHandleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  // Simple direct approach: force scroll to top on results page when coming from landing page
  useEffect(() => {
    console.log('ScrollToTop: === ROUTE CHANGE DETECTED ===', {
      pathname,
      previousPathname: previousPathnameRef.current,
      state,
      isInitialLoad: previousPathnameRef.current === null,
      timestamp: new Date().toISOString(),
    });

    // Skip scroll on initial load
    if (previousPathnameRef.current === null) {
      console.log('ScrollToTop: Initial load, setting previous pathname');
      previousPathnameRef.current = pathname;
      return;
    }

    // If the pathname changed
    if (pathname !== previousPathnameRef.current) {
      console.log(
        'ScrollToTop: Pathname changed from',
        previousPathnameRef.current,
        'to',
        pathname,
      );
      console.log('ScrollToTop: Location state details:', {
        hasState: !!state,
        hasResult: !!state?.result,
        resultKeys: state?.result ? Object.keys(state.result) : [],
        isRestored: state?.isRestored,
      });

      // SIMPLIFIED LOGIC: Force scroll to top for all results page navigation with result data
      if (pathname.startsWith('/results') && state?.result && !state?.isRestored) {
        console.log('ScrollToTop: SIMPLIFIED - Forcing scroll to top for results with result data');

        // Multiple attempts to scroll to top
        const scrollToTopMultiple = () => {
          console.log('ScrollToTop: Attempting scroll to top - current position:', window.scrollY);
          window.scrollTo(0, 0);

          // Check if scroll worked
          setTimeout(() => {
            console.log('ScrollToTop: After scroll attempt - position:', window.scrollY);
            if (window.scrollY > 10) {
              console.log('ScrollToTop: Scroll failed, trying again');
              window.scrollTo(0, 0);
              setTimeout(() => {
                console.log('ScrollToTop: Second attempt - position:', window.scrollY);
              }, 100);
            }
          }, 100);
        };

        // Immediate attempt
        scrollToTopMultiple();

        // Delayed attempts
        setTimeout(scrollToTopMultiple, 300);
        setTimeout(scrollToTopMultiple, 1000);
      } else {
        // Use original logic for other cases
        const scrollAction = getScrollAction(pathname, state, previousPathnameRef.current);

        console.log('ScrollToTop: === SCROLL DECISION ===', {
          action: scrollAction.action,
          scrollY: scrollAction.scrollY,
          pathname,
          hasResult: !!state?.result,
          resultId: state?.result ? getResultId(state.result) : 'no-result',
        });

        // Execute the determined scroll action
        window.requestAnimationFrame(() => {
          console.log('ScrollToTop: === EXECUTING SCROLL ACTION ===', scrollAction.action);
          switch (scrollAction.action) {
            case 'scrollToTop':
              console.log(
                'ScrollToTop: EXECUTING scroll to top - current position:',
                window.scrollY,
              );

              // Immediate scroll
              window.scrollTo(0, 0);
              console.log('ScrollToTop: After immediate scrollTo(0,0) - position:', window.scrollY);

              // Delayed scroll to handle async content loading
              setTimeout(() => {
                console.log('ScrollToTop: Delayed scroll check - position:', window.scrollY);
                if (window.scrollY > 10) {
                  console.log('ScrollToTop: Page moved down, scrolling to top again');
                  window.scrollTo(0, 0);
                  setTimeout(() => {
                    console.log('ScrollToTop: Final scroll check - position:', window.scrollY);
                  }, 100);
                }
              }, 300);

              break;
            case 'restorePosition':
              console.log(
                'ScrollToTop: EXECUTING restore position to:',
                scrollAction.scrollY,
                '- current:',
                window.scrollY,
              );
              window.scrollTo(0, scrollAction.scrollY);
              console.log('ScrollToTop: After restore - position:', window.scrollY);
              break;
            case 'noScroll':
              console.log('ScrollToTop: EXECUTING no scroll - current position:', window.scrollY);
              break;
          }
        });
      }

      // Reset the popstate flag after handling
      isPopStateRef.current = false;
      previousPathnameRef.current = pathname;
      console.log('ScrollToTop: Updated previous pathname to:', pathname);
    } else {
      console.log('ScrollToTop: Pathname did not change, skipping scroll logic');
    }
  }, [pathname, state]);

  // Determine scroll action based on route, navigation type, and scroll memory
  const getScrollAction = (currentPath, locationState, previousPath) => {
    console.log('ScrollToTop: getScrollAction called', {
      currentPath,
      previousPath,
      hasResult: !!locationState?.result,
      isRestored: locationState?.isRestored,
      isPopState: isPopStateRef.current,
      lastResultId: lastResultIdRef.current,
    });

    // Don't scroll on popstate (back/forward button navigation) - restore position if available
    if (isPopStateRef.current) {
      console.log('ScrollToTop: Detected popstate navigation');
      const scrollMemory = scrollMemoryRef.current.get(currentPath);
      if (scrollMemory && Date.now() - scrollMemory.timestamp < 3 * 60 * 1000) {
        console.log('ScrollToTop: Restoring scroll position from memory (popstate)', scrollMemory);
        return { action: 'restorePosition', scrollY: scrollMemory.scrollY };
      }
      console.log('ScrollToTop: No scroll position memory available (popstate)');
      return { action: 'noScroll' };
    }

    // For results page, scroll to top for new evaluations only
    if (currentPath.startsWith('/results')) {
      console.log('ScrollToTop: Processing results page navigation');
      const result = locationState?.result;
      const resultId = getResultId(result);
      const isRestored = locationState?.isRestored;

      console.log('ScrollToTop: Results page details', {
        hasResult: !!result,
        resultId,
        isRestored,
        lastResultId: lastResultIdRef.current,
      });

      // If we have a result and it's different from the last one, scroll to top
      if (result && resultId) {
        const isNewResult = resultId !== lastResultIdRef.current;
        console.log('ScrollToTop: Results page evaluation', {
          resultId,
          lastResultId: lastResultIdRef.current,
          isNewResult,
          isRestored,
        });

        if (isNewResult && !isRestored) {
          lastResultIdRef.current = resultId;
          console.log('ScrollToTop: NEW RESULT DETECTED - Scrolling to top');
          return { action: 'scrollToTop' };
        } else {
          console.log('ScrollToTop: Not a new result or is restored - checking scroll memory');
        }
      } else {
        console.log('ScrollToTop: No result or resultId available - checking scroll memory');
      }

      // For results page without new result data, check if we have scroll memory
      const scrollMemory = scrollMemoryRef.current.get(currentPath);
      if (scrollMemory && Date.now() - scrollMemory.timestamp < 3 * 60 * 1000) {
        console.log('ScrollToTop: Restoring scroll position for existing results', scrollMemory);
        return { action: 'restorePosition', scrollY: scrollMemory.scrollY };
      }

      console.log('ScrollToTop: No scroll memory for results page - not scrolling');
      return { action: 'noScroll' };
    }

    // For other pages, check if we have scroll memory and it's not expired
    console.log('ScrollToTop: Processing non-results page navigation');
    const scrollMemory = scrollMemoryRef.current.get(currentPath);
    if (scrollMemory && Date.now() - scrollMemory.timestamp < 3 * 60 * 1000) {
      console.log('ScrollToTop: Restoring scroll position for visited page', scrollMemory);
      return { action: 'restorePosition', scrollY: scrollMemory.scrollY };
    }

    // First visit to this route or memory expired, scroll to top
    console.log('ScrollToTop: First visit or expired memory, scrolling to top');
    return { action: 'scrollToTop' };
  };

  // Add immediate scroll check for results page with different approach
  useEffect(() => {
    console.log('ScrollToTop: DIRECT CHECK - pathname:', pathname, 'has result:', !!state?.result);

    if (pathname.startsWith('/results') && state?.result && !state?.isRestored) {
      console.log(
        'ScrollToTop: DIRECT CHECK - Results page with result detected, using multiple methods',
      );

      // Method 1: Direct DOM manipulation
      const scrollDirect = () => {
        console.log('ScrollToTop: Direct scroll - before:', window.scrollY);

        // Try multiple scroll methods
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Also try scrollIntoView on body
        if (document.body) {
          document.body.scrollIntoView({ behavior: 'instant', block: 'start' });
        }

        // Try setting CSS scroll-behavior
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';

        console.log('ScrollToTop: Direct scroll - after:', window.scrollY);
      };

      // Execute immediately and multiple times
      scrollDirect();

      // Use setInterval for persistent attempts
      let attempts = 0;
      const intervalId = setInterval(() => {
        attempts++;
        console.log(`ScrollToTop: Interval attempt ${attempts} - position:`, window.scrollY);

        if (window.scrollY > 10) {
          scrollDirect();
        }

        if (attempts >= 20) {
          // Stop after 20 attempts (2 seconds)
          clearInterval(intervalId);
          console.log('ScrollToTop: Stopping interval attempts');
        }
      }, 100);

      // Clear interval on cleanup
      return () => clearInterval(intervalId);
    }
  }, [pathname, state]);

  // This component doesn't render anything normally, but add debug button for testing
  if (!FRONTEND_CONFIG.isProd) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: 'red',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'none',
        }}
        onClick={() => {
          console.log('ScrollToTop: TEST BUTTON CLICKED');
          console.log('ScrollToTop: Current scroll position before:', window.scrollY);
          window.scrollTo(0, 0);
          console.log('ScrollToTop: Current scroll position after:', window.scrollY);

          // Test navigation to results page with mock data
          setTimeout(() => {
            console.log('ScrollToTop: Testing navigation to /results with mock result');
            const mockResult = {
              overall_score: 75,
              business_problem: 'Test problem',
              business_solution: 'Test solution',
              confidence_level: 85,
            };
            // Use React Router navigation instead of window.location
            window.history.pushState({ result: mockResult }, '', '/results');
            window.dispatchEvent(new PopStateEvent('popstate', { state: { result: mockResult } }));
          }, 1000);
        }}
      >
        TEST SCROLL TO TOP
      </div>
    );
  }

  return null;
}

ScrollToTop.propTypes = {};
