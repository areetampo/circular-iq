/**
 * Global dialog state shared through `DialogProvider` and consumed with `useGlobalDialog`.
 * Mounts in `AppProvider`; `DialogManager` reads the active dialog type, payload, and priority.
 */

import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

import { useDialog } from '@/hooks';

const DialogContext = createContext();

/**
 * Provides single-dialog state and priority-aware open helpers to the app tree.
 *
 * @example
 * const { openConfirmDialog } = useGlobalDialog();
 */
export const DialogProvider = ({ children }) => {
  const dialogValue = useDialog();
  return <DialogContext.Provider value={dialogValue}>{children}</DialogContext.Provider>;
};

DialogProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Consumes global dialog state and priority-aware opener helpers. Must be used within `DialogProvider`.
 *
 * @returns {{
 *   dialog: { type: string|null, data: Object|null, priority: number },
 *   isDialogOpen: boolean,
 *   onClose: () => void,
 *   openDialogWithPriority: (type: string, data?: Object, priority?: number) => void,
 *   openDeleteAssessmentDialog: (data: Object) => void,
 *   openSaveAssessmentDialog: (data: Object) => void,
 *   openRenameAssessmentDialog: (data: Object) => void,
 *   openReplaceInputsDialog: (data: Object) => void,
 *   openConfirmDialog: (data: Object) => void,
 *   openResultsRestoreDialog: () => void,
 *   openLimitReachedDialog: (data: Object) => void
 * }} Dialog context API used by DialogManager and shared dialog triggers.
 * @throws {Error} When used outside `DialogProvider`.
 */
export const useGlobalDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(
      'useGlobalDialog must be used within a DialogProvider. ' +
        'Check that the calling component is not rendered above AppProvider ' +
        'or inside an ErrorBoundary fallback.',
    );
  }
  return context;
};
