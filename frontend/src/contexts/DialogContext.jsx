/**
 * @module DialogContext
 * @description Global dialog state — wraps useDialog() for app-wide access via useGlobalDialog().
 * Mount DialogProvider in AppProvider; DialogManager renders the active dialog by type.
 *
 * @example
 * import { useGlobalDialog } from '@/contexts/DialogContext';
 *
 * function MyComponent() {
 *   const { openDeleteAssessmentDialog } = useGlobalDialog();
 *
 *   const handleDelete = (assessmentId) => {
 *     openDeleteAssessmentDialog({
 *       assessmentName: 'My Assessment',
 *       assessmentId,
 *       onConfirm: async () => { ... },
 *     });
 *   };
 *
 *   return <Button onPress={() => handleDelete(123)}>Delete</Button>;
 * }
 */

import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

import { useDialog } from '@/hooks';

const DialogContext = createContext();

/**
 * Provides global dialog state from `useDialog()` to the React tree.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @returns {import('react').ReactElement}
 */
export const DialogProvider = ({ children }) => {
  const dialogValue = useDialog();
  return <DialogContext.Provider value={dialogValue}>{children}</DialogContext.Provider>;
};

DialogProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Global dialog API (same surface as `useDialog`, provided via context).
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
 *   openResultsRestoreDialog: (data: Object) => void,
 *   openLimitReachedDialog: (data: Object) => void
 * }}
 * @throws {Error} When used outside `DialogProvider`.
 *
 * @example
 * const { openDeleteAssessmentDialog, isDialogOpen, onClose } = useGlobalDialog();
 */
export const useGlobalDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useGlobalDialog must be used within a DialogProvider');
  }
  return context;
};
