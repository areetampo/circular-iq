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

import { useState, useCallback, useMemo } from 'react';
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

  const openDialogWithPriority = useCallback((type, data = null, priority = 0) => {
    setDialogState((prev) => {
      const currentPriority = prev?.priority || 0;
      // console.log(
      //   'Attempting to open dialog:',
      //   type,
      //   'with priority',
      //   priority,
      //   'Current dialog:',
      //   prev?.type,
      //   'priority',
      //   currentPriority,
      // );
      if (prev.type && currentPriority > priority) return prev;
      return { type, data, priority };
    });
  }, []);

  const onClose = useCallback(() => {
    setDialogState({ type: null, data: null, priority: 0 });
  }, []);

  const openDialog = useCallback(
    (type, data = null) => openDialogWithPriority(type, data, 0),
    [openDialogWithPriority],
  );

  // Stable wrappers for dialog openers so their identity doesn't change
  // when dialogState updates. This prevents consumers from re-running
  // effects when only dialogState changes.
  const openDeleteAssessmentDialog = useCallback(
    (data) =>
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
    [openDialogWithPriority],
  );

  const openSaveAssessmentDialog = useCallback(
    (data) =>
      openDialogWithPriority(
        DIALOGS.SAVE_ASSESSMENT,
        { defaultName: data?.defaultName, onSave: data?.onSave },
        DIALOG_PRIORITIES.MEDIUM,
      ),
    [openDialogWithPriority],
  );

  const openRenameAssessmentDialog = useCallback(
    (data) =>
      openDialogWithPriority(
        DIALOGS.RENAME_ASSESSMENT,
        { defaultName: data?.defaultName, onRename: data?.onRename, isLoading: data?.isLoading },
        DIALOG_PRIORITIES.MEDIUM,
      ),
    [openDialogWithPriority],
  );

  const openReplaceInputsDialog = useCallback(
    (data) => openDialogWithPriority(DIALOGS.REPLACE_INPUTS, data, DIALOG_PRIORITIES.LOW),
    [openDialogWithPriority],
  );

  const openConfirmDialog = useCallback(
    (data) =>
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
    [openDialogWithPriority],
  );

  const openSessionRestoreDialog = useCallback(
    (data) =>
      openDialogWithPriority(
        DIALOGS.SESSION_RESTORE,
        { onRestore: data?.onRestore, onDismiss: data?.onDismiss, sessionData: data?.sessionData },
        DIALOG_PRIORITIES.HIGH,
      ),
    [openDialogWithPriority],
  );

  const openLimitReachedDialog = useCallback(
    (data) =>
      openDialogWithPriority(
        DIALOGS.LIMIT_REACHED,
        { limit: data?.limit, message: data?.message },
        DIALOG_PRIORITIES.MEDIUM,
      ),
    [openDialogWithPriority],
  );

  return {
    dialog: dialogState,
    isDialogOpen: Boolean(dialogState.type),
    onClose,
    openDialogWithPriority,
    openDeleteAssessmentDialog,
    openSaveAssessmentDialog,
    openRenameAssessmentDialog,
    openReplaceInputsDialog,
    openConfirmDialog,
    openSessionRestoreDialog,
    openLimitReachedDialog,
  };
}
