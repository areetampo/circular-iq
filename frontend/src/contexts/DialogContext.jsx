/**
 * Dialog Context
 * Global context provider for centralized dialog state management
 * Follows same pattern as ModalContext.jsx for consistency
 *
 * Location: src/contexts/DialogContext.jsx
 *
 * The DialogProvider should be placed in AppProvider.jsx and wraps
 * the entire application to make dialog state globally accessible.
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
 *   return <Button onClick={() => handleDelete(123)}>Delete</Button>;
 * }
 */

import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';

import { useDialog } from '@/hooks';

const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const dialogValue = useDialog();
  return <DialogContext.Provider value={dialogValue}>{children}</DialogContext.Provider>;
};

DialogProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to consume the global dialog state
 *
 * @throws {Error} if used outside of DialogProvider
 * @returns {Object} Dialog state and control functions
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
