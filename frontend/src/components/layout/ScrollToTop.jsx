/** Route-change scroll manager for result pages, back navigation, and short-lived scroll memory. */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { FRONTEND_CONFIG } from '@/config/frontend.config';

/**
 * Preserves route scroll positions for back/forward navigation and resets new result pages to top.
 * Scroll memory expires after three minutes and result pages get extra enforcement for async layout shifts.
 */
export default function ScrollToTop() {
  const { pathname, state } = useLocation();

  const isPopStateRef = useRef(false);
  const previousPathnameRef = useRef(null);
  const lastResultIdRef = useRef(null);

  // pathname -> { scrollY, timestamp }
  const scrollMemoryRef = useRef(new Map());

  const cleanupTimeoutRef = useRef(null);

  // Browser back/forward navigation should restore route-specific scroll memory.
  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  /**
   * Builds a stable identifier for result payloads so new results can force top-scroll behavior.
   *
   * @param {Object|null|undefined} result - Location state result payload or nested result wrapper.
   * @returns {string|null} Request/public ID when available, otherwise a content-derived fallback key.
   */
  const getResultId = (result) => {
    if (!result) return null;

    const actualResult = result?.result || result;

    // Request IDs are the most reliable way to distinguish calculations.
    if (actualResult?.processing_info?.request_id) {
      return actualResult.processing_info.request_id;
    }

    // Saved or shared assessments may only expose public or assessment IDs.
    const possibleIds = [
      actualResult?.id,
      actualResult?.public_id,
      actualResult?.assessment?.id,
      actualResult?.assessment?.public_id,
    ];

    for (const id of possibleIds) {
      if (id) return id;
    }

    // Last fallback uses score and text snippets to distinguish anonymous calculations.
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

    return `${score}_${confidence}_${problemHash}_${solutionHash}_${categoryScores}`;
  };

  // Track scroll position changes and store them in memory.
  useEffect(() => {
    const handleScroll = () => {
      const currentPath = window.location.pathname;
      const scrollY = window.scrollY;

      // Tiny scroll offsets are usually layout noise and should not override useful memory.
      if (scrollY > 50) {
        scrollMemoryRef.current.set(currentPath, {
          scrollY,
          timestamp: Date.now(),
        });

        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
        }

        // Cleanup is delayed until scrolling occurs so idle pages do no extra work.
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

    // Throttle scroll writes during continuous scrolling.
    let scrollTimeout;

    const throttledHandleScroll = () => {
      if (scrollTimeout) return;

      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  // Main route-change scroll logic.
  useEffect(() => {
    // Initial load lets the browser keep its current position.
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname;
      return;
    }

    // Ignore state-only updates that do not change the path.
    if (pathname !== previousPathnameRef.current) {
      const isAssessmentRoute = pathname.startsWith('/assessments/');
      const hasResultData = state?.result;
      const isNotRestored = !state?.isRestored;

      // New result and assessment navigations should begin at the top, regardless of prior memory.
      if (
        (pathname.startsWith('/results') || isAssessmentRoute) &&
        (hasResultData || isAssessmentRoute) &&
        isNotRestored
      ) {
        const scrollToTopMultiple = () => {
          window.scrollTo(0, 0);

          setTimeout(() => {
            if (window.scrollY > 10) {
              window.scrollTo(0, 0);
            }
          }, 100);
        };

        // Repeat after async rendering/content shifts that can push the page back down.
        scrollToTopMultiple();
        setTimeout(scrollToTopMultiple, 300);
        setTimeout(scrollToTopMultiple, 1000);
      } else {
        const scrollAction = getScrollAction(pathname, state, previousPathnameRef.current);

        window.requestAnimationFrame(() => {
          switch (scrollAction.action) {
            case 'scrollToTop':
              window.scrollTo(0, 0);

              // Handle delayed layout/content shifts after a normal scroll-to-top action.
              setTimeout(() => {
                if (window.scrollY > 10) {
                  window.scrollTo(0, 0);
                }
              }, 300);

              break;

            case 'restorePosition':
              window.scrollTo(0, scrollAction.scrollY);
              break;

            case 'noScroll':
            default:
              break;
          }
        });
      }

      isPopStateRef.current = false;
      previousPathnameRef.current = pathname;
    }
  }, [pathname, state]);

  /**
   * Chooses the scroll action for a route based on navigation type, result identity, and memory.
   *
   * @param {string} currentPath - Current `location.pathname`.
   * @param {Object|null|undefined} locationState - Current React Router location state.
   * @returns {{ action: 'scrollToTop'|'restorePosition'|'noScroll', scrollY?: number }}
   *   Scroll directive for the route-change effect.
   */
  const getScrollAction = (currentPath, locationState) => {
    // Back/forward navigation restores recent scroll memory when available.
    if (isPopStateRef.current) {
      const scrollMemory = scrollMemoryRef.current.get(currentPath);

      if (scrollMemory && Date.now() - scrollMemory.timestamp < 3 * 60 * 1000) {
        return {
          action: 'restorePosition',
          scrollY: scrollMemory.scrollY,
        };
      }

      return { action: 'noScroll' };
    }

    // Results and assessment routes have special handling for new calculations and direct access.
    if (currentPath.startsWith('/results') || currentPath.startsWith('/assessments/')) {
      const result = locationState?.result;
      const resultId = getResultId(result);
      const isRestored = locationState?.isRestored;

      const isAssessmentDetailRoute =
        currentPath.startsWith('/assessments/') &&
        !currentPath.includes('/share') &&
        !currentPath.includes('/compare') &&
        currentPath.split('/').length === 3;

      const isAssessmentShareRoute =
        currentPath.startsWith('/assessments/share/') || currentPath === '/assessments/share';

      const isAssessmentCompareRoute = currentPath.startsWith('/assessments/compare');

      // Direct assessment route access has no result payload, so start from the top.
      if (
        (isAssessmentDetailRoute || isAssessmentShareRoute || isAssessmentCompareRoute) &&
        !isRestored &&
        !result
      ) {
        return { action: 'scrollToTop' };
      }

      // New result payloads should reset once, then become eligible for restoration.
      if (result && resultId) {
        const isNewResult = resultId !== lastResultIdRef.current;

        if (isNewResult && !isRestored) {
          lastResultIdRef.current = resultId;

          return { action: 'scrollToTop' };
        }
      }

      // Existing result routes restore recent scroll memory when available.
      const scrollMemory = scrollMemoryRef.current.get(currentPath);

      if (scrollMemory && Date.now() - scrollMemory.timestamp < 3 * 60 * 1000) {
        return {
          action: 'restorePosition',
          scrollY: scrollMemory.scrollY,
        };
      }

      return { action: 'noScroll' };
    }

    // Other routes restore recent memory or start at top by default.
    const scrollMemory = scrollMemoryRef.current.get(currentPath);

    if (scrollMemory && Date.now() - scrollMemory.timestamp < 3 * 60 * 1000) {
      return {
        action: 'restorePosition',
        scrollY: scrollMemory.scrollY,
      };
    }

    return { action: 'scrollToTop' };
  };

  // Additional fallback scroll enforcement for results/assessment pages.
  useEffect(() => {
    const isAssessmentRoute = pathname.startsWith('/assessments/');
    const hasResultData = state?.result;
    const isNotRestored = !state?.isRestored;

    if (
      (pathname.startsWith('/results') || isAssessmentRoute) &&
      (hasResultData || isAssessmentRoute) &&
      isNotRestored
    ) {
      const scrollDirect = () => {
        window.scrollTo(0, 0);

        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        if (document.body) {
          document.body.scrollIntoView({
            behavior: 'instant',
            block: 'start',
          });
        }

        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
      };

      scrollDirect();

      let attempts = 0;

      const intervalId = setInterval(() => {
        attempts++;

        if (window.scrollY > 10) {
          scrollDirect();
        }

        if (attempts >= 20) {
          clearInterval(intervalId);
        }
      }, 100);

      return () => clearInterval(intervalId);
    }
  }, [pathname, state]);

  // Hidden dev-only manual tester for route scroll behavior.
  if (!FRONTEND_CONFIG.isProduction) {
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
          window.scrollTo(0, 0);

          setTimeout(() => {
            const mockResult = {
              overall_score: 75,
              business_problem: 'Test problem',
              business_solution: 'Test solution',
              confidence_level: 85,
            };

            window.history.pushState({ result: mockResult }, '', '/results');

            window.dispatchEvent(
              new PopStateEvent('popstate', {
                state: { result: mockResult },
              }),
            );
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
