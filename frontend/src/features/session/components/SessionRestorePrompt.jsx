import React from 'react';
import PropTypes from 'prop-types';
import { SessionRestoreDialog } from '@/components/dialogs';

/**
 * SessionRestorePrompt component
 * Wrapper for SessionRestoreDialog to maintain backward compatibility
 *
 * Usage with useSession hook:
 * ```jsx
 * const { hasEvaluationState, restoreEvaluation, clearEvaluation } = useSession();
 *
 * {hasEvaluationState && (
 *   <SessionRestorePrompt
 *     onRestore={() => {
 *       const state = restoreEvaluation();
 *       // Apply state to form...
 *     }}
 *     onDismiss={() => clearEvaluation()}
 *   />
 * )}
 * ```
 */
export default function SessionRestorePrompt({ isOpen = true, onRestore, onDismiss }) {
  return <SessionRestoreDialog isOpen={isOpen} onRestore={onRestore} onDismiss={onDismiss} />;
}

SessionRestorePrompt.propTypes = {
  isOpen: PropTypes.bool,
  onRestore: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
