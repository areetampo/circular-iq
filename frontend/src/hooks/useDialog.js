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

// Dialog priority levels (higher = more important)
// Higher priority dialogs prevent lower priority ones from opening
export const DIALOG_PRIORITIES = {
  CRITICAL: 20,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 0,
};

/**
 * Enhanced dialog hook with priority support.
 * DialogState now contains: { type, data, priority }
 * Higher numeric priority prevents lower-priority dialogs from opening.
 */
export default function useDialog() {
  const [dialogState, setDialogState] = useState({ type: null, data: null, priority: 0 });

  const openDialogWithPriority = (type, data = null, priority = 0) => {
    const currentPriority = dialogState?.priority || 0;
    // If an active dialog has higher priority, ignore this request
    if (dialogState.type && currentPriority > priority) return;
    setDialogState({ type, data, priority });
  };

  const onClose = () => {
    setDialogState({ type: null, data: null, priority: 0 });
  };

  // Backwards-compatible openDialog (no priority)
  const openDialog = (type, data = null) => openDialogWithPriority(type, data, 0);

  return {
    dialog: dialogState,
    isDialogOpen: Boolean(dialogState.type),
    onClose,
    openDialogWithPriority,

    // Delete Assessment Dialog (medium)
    openDeleteAssessmentDialog: (data) =>
      openDialogWithPriority(
        DIALOGS.DELETE_ASSESSMENT,
        {
          assessmentName: data?.assessmentName,
          assessmentId: data?.assessmentId,
          onConfirm: data?.onConfirm,
          isLoading: data?.isLoading,
        },
        DIALOG_PRIORITIES.MEDIUM,
      ),

    // Save Assessment Dialog (medium)
    openSaveAssessmentDialog: (data) =>
      openDialogWithPriority(
        DIALOGS.SAVE_ASSESSMENT,
        {
          defaultName: data?.defaultName,
          onSave: data?.onSave,
        },
        DIALOG_PRIORITIES.MEDIUM,
      ),

    // Rename Assessment Dialog (medium)
    openRenameAssessmentDialog: (data) =>
      openDialogWithPriority(
        DIALOGS.RENAME_ASSESSMENT,
        {
          defaultName: data?.defaultName,
          onRename: data?.onRename,
          isLoading: data?.isLoading,
        },
        DIALOG_PRIORITIES.MEDIUM,
      ),

    // Replace Inputs Dialog (low)
    openReplaceInputsDialog: (data) =>
      openDialogWithPriority(DIALOGS.REPLACE_INPUTS, data, DIALOG_PRIORITIES.LOW),

    // Generic Confirm Dialog (low by default, can accept custom priority)
    openConfirmDialog: (data) =>
      openDialogWithPriority(
        DIALOGS.CONFIRM,
        {
          title: data?.title,
          description: data?.description,
          confirmText: data?.confirmText,
          cancelText: data?.cancelText,
          onConfirm: data?.onConfirm,
          variant: data?.variant,
          isLoading: data?.isLoading,
        },
        data?.priority ?? DIALOG_PRIORITIES.LOW,
      ),

    // Session Restore Dialog (high)
    openSessionRestoreDialog: (data) =>
      openDialogWithPriority(
        DIALOGS.SESSION_RESTORE,
        {
          onRestore: data?.onRestore,
          onDismiss: data?.onDismiss,
          sessionData: data?.sessionData,
        },
        DIALOG_PRIORITIES.HIGH,
      ),

    // Limit reached dialog (medium)
    openLimitReachedDialog: (data) =>
      openDialogWithPriority(
        DIALOGS.LIMIT_REACHED,
        { limit: data?.limit, message: data?.message },
        DIALOG_PRIORITIES.MEDIUM,
      ),
  };
}
