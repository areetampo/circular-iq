import { useNavigate } from 'react-router-dom';

/**
 * `navigate(-1)` when in-app history exists (vs `__APP_INITIAL_HISTORY_LENGTH`); otherwise `fallbackRoute`.
 *
 * @param {string} [fallbackRoute='/'] - Route used when there is no in-app history entry to go back to.
 * @returns {() => void} Back-navigation callback for buttons or menu actions. Because this is a hook return value, call `useSafeBack` only at component top level, not inside callbacks.
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
