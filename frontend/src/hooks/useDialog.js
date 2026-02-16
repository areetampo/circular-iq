/**
 * useDialog Hook
 * Central state management for dialogs
 * Follows same pattern as useModal.js for consistency
 *
 * Location: src/hooks/useDialog.js
 *
 * This hook manages a single dialogState object with:
 * - type: string identifying which dialog to render (required)
 * - data: optional payload passed to the dialog
 *
 * @example
 * const { openDeleteAssessmentDialog, onClose, isDialogOpen } = useDialog();
 *
 * // Open dialog with data
 * openDeleteAssessmentDialog({ assessmentName: 'My Project' });
 *
 * // Access state
 * if (isDialogOpen) { ... }
 *
 * // Close dialog
 * onClose();
 */

import { useState } from 'react';
import { DIALOGS } from '@/components/dialogs/dialogTypes';

export default function useDialog() {
  const [dialogState, setDialogState] = useState({ type: null, data: null });

  const openDialog = (type, data = null) => {
    setDialogState({ type, data });
  };

  const onClose = () => {
    setDialogState({ type: null, data: null });
  };

  return {
    dialog: dialogState,
    isDialogOpen: dialogState.type !== null,
    onClose,

    // Delete Assessment Dialog
    openDeleteAssessmentDialog: (data) =>
      openDialog(DIALOGS.DELETE_ASSESSMENT, {
        assessmentName: data?.assessmentName,
        assessmentId: data?.assessmentId,
        onConfirm: data?.onConfirm,
        isLoading: data?.isLoading,
      }),

    // Save Assessment Dialog
    openSaveAssessmentDialog: (data) =>
      openDialog(DIALOGS.SAVE_ASSESSMENT, {
        defaultName: data?.defaultName,
        onSave: data?.onSave,
      }),

    // Rename Assessment Dialog
    openRenameAssessmentDialog: (data) =>
      openDialog(DIALOGS.RENAME_ASSESSMENT, {
        defaultName: data?.defaultName,
        onRename: data?.onRename,
        isLoading: data?.isLoading,
      }),

    // Replace Inputs Dialog
    openReplaceInputsDialog: (data) => openDialog(DIALOGS.REPLACE_INPUTS, data),

    // Generic Confirm Dialog
    openConfirmDialog: (data) =>
      openDialog(DIALOGS.CONFIRM, {
        title: data?.title,
        description: data?.description,
        confirmText: data?.confirmText,
        cancelText: data?.cancelText,
        onConfirm: data?.onConfirm,
        variant: data?.variant,
        isLoading: data?.isLoading,
      }),

    // Session Restore Dialog
    openSessionRestoreDialog: (data) =>
      openDialog(DIALOGS.SESSION_RESTORE, {
        onRestore: data?.onRestore,
        onDismiss: data?.onDismiss,
      }),
  };
}
