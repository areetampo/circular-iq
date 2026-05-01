import { useNavigate } from 'react-router-dom';

/**
 * Safely navigates back if the previous page is within the app,
 * otherwise navigates to the home route (or a custom fallback).
 *
 * This hook must be called at the top level of a React component or another custom hook.
 * It returns a function that you can attach to event handlers like `onClick`.
 *
 * @param {string} [fallbackRoute='/'] - Route to go to when no internal history exists.
 * @returns {Function} A function that triggers the safe back navigation. Call this function
 *                     in response to user interactions (e.g., button click).
 *
 * @example
 * ✅ Correct usage
 * function MyComponent() {
 *   const goBackSafely = useSafeBack('/');
 *
 *   return <button onClick={goBackSafely}>Go Back</button>;
 * }
 *
 * @example
 * ❌ Incorrect usage (causes "Invalid hook call" error)
 * function MyComponent() {
 *   return (
 *     <button onClick={() => useSafeBack()}>
 *       Go Back
 *     </button>
 *   );
 * }
 */
export const useSafeBack = (fallbackRoute = '/') => {
  const navigate = useNavigate();

  return () => {
    const initialLength = window.__APP_INITIAL_HISTORY_LENGTH;
    const canGoBack = initialLength !== undefined && window.history.length > initialLength;

    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallbackRoute, { replace: true });
    }
  };
};
