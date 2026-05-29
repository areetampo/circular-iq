import { useCallback, useState } from 'react';

import DIALOGS from '@/constants/dialogTypes';

// Higher priority dialogs prevent lower priority ones from replacing a critical flow.
const DIALOG_PRIORITIES = {
  CRITICAL: 20,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 0,
};

/**
 * Manages one active dialog with priority-based replacement rules.
 * Lower-priority dialogs cannot replace an already open higher-priority dialog.
 *
 * @returns {{
 *   dialog: { type: string|null, data: Object|null, priority: number },
 *   isDialogOpen: boolean,
 *   onClose: () => void,
 *   openDialogWithPriority: (type: string, data?: Object, priority?: number) => void,
 *   openDeleteAssessmentDialog: (data: { assessmentName?: string, assessmentId?: string, onConfirm?: Function, isLoading?: boolean }) => void,
 *   openSaveAssessmentDialog: (data: { defaultName?: string, onSave?: Function, scoringResult?: Object }) => void,
 *   openRenameAssessmentDialog: (data: { defaultName?: string, onRename?: Function, isLoading?: boolean }) => void,
 *   openReplaceInputsDialog: (data: { title?: string, description?: string, confirmText?: string, cancelText?: string, onConfirm?: Function, onCancel?: Function }) => void,
 *   openConfirmDialog: (data: { title?: string, description?: string, confirmText?: string, cancelText?: string, onConfirm?: Function, variant?: string, isLoading?: boolean, priority?: number }) => void,
 *   openResultsRestoreDialog: () => void,
 *   openLimitReachedDialog: (data: { lastUsedAt?: string|number|Date, anonScoringLimit?: number, anonScoringUsageRetentionDays?: number }) => void
 * }} Dialog state plus priority-aware opener callbacks for shared modal workflows.
 */
export default function useDialog() {
  const [dialogState, setDialogState] = useState({ type: null, data: null, priority: 0 });

  const openDialogWithPriority = useCallback((type, data = null, priority = 0) => {
    setDialogState((prev) => {
      const currentPriority = prev?.priority || 0;
      if (prev.type && currentPriority > priority) return prev;
      return { type, data, priority };
    });
  }, []);

  const onClose = useCallback(() => {
    setDialogState({ type: null, data: null, priority: 0 });
  }, []);

  // Stable wrappers prevent consumers from re-running effects when only dialogState changes.
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
    (data) =>
      openDialogWithPriority(
        DIALOGS.REPLACE_INPUTS,
        {
          title: data?.title,
          description: data?.description,
          confirmText: data?.confirmText,
          cancelText: data?.cancelText,
          onConfirm: data?.onConfirm,
          onCancel: data?.onCancel,
        },
        DIALOG_PRIORITIES.LOW,
      ),
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

  // ResultsRestoreDialog reads localStorage directly, so no caller data is accepted.
  const openResultsRestoreDialog = useCallback(
    () => openDialogWithPriority(DIALOGS.SESSION_RESULTS_RESTORE, null, DIALOG_PRIORITIES.HIGH),
    [openDialogWithPriority],
  );

  const openLimitReachedDialog = useCallback(
    (data) =>
      openDialogWithPriority(
        DIALOGS.LIMIT_REACHED,
        {
          lastUsedAt: data?.lastUsedAt,
          anonScoringLimit: data?.anonScoringLimit,
          anonScoringUsageRetentionDays: data?.anonScoringUsageRetentionDays,
        },
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
