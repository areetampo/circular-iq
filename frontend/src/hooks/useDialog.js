/**
 * @module useDialog
 * @description Central dialog stack for the app (single active dialog with priority).
 * Higher-priority dialogs block lower-priority ones from opening.
 * Consumed by `DialogContext` and `DialogManager`.
 *
 * @example
 * const { openDeleteAssessmentDialog, onClose, isDialogOpen } = useDialog();
 * openDeleteAssessmentDialog({ assessmentName: 'My Project', onConfirm: handleDelete });
 */

import { useCallback, useState } from 'react';

import DIALOGS from '@/constants/dialogTypes';

// Dialog priority levels (higher = more important)
// Higher priority dialogs prevent lower priority ones from opening
const DIALOG_PRIORITIES = {
  CRITICAL: 20,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 0,
};

/**
 * Manages a single active modal with priority-based preemption.
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
 */
export default function useDialog() {
  const [dialogState, setDialogState] = useState({ type: null, data: null, priority: 0 });

  const openDialogWithPriority = useCallback((type, data = null, priority = 0) => {
    setDialogState((prev) => {
      const currentPriority = prev?.priority || 0;
      // logger.log(
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
        {
          defaultName: data?.defaultName,
          onSave: data?.onSave,
          scoringResult: data?.scoringResult,
        },
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

  const openResultsRestoreDialog = useCallback(
    (data) => openDialogWithPriority(DIALOGS.SESSION_RESULTS_RESTORE, data, DIALOG_PRIORITIES.HIGH),
    [openDialogWithPriority],
  );

  const openLimitReachedDialog = useCallback(
    (data) =>
      openDialogWithPriority(
        DIALOGS.LIMIT_REACHED,
        { anonScoringLimit: data?.anonScoringLimit },
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
    openResultsRestoreDialog,
    openLimitReachedDialog,
  };
}
