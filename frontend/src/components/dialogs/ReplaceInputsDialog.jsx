/**
 * Replace Inputs Dialog
 * Specialized confirmation dialog for replacing form inputs
 * Uses success status to indicate positive action
 *
 * Now uses centralized dialog state via useGlobalDialog()
 *
 * Location: src/components/dialogs/ReplaceInputsDialog.jsx
 */

import { AlertDialog } from '@heroui/react';
import { AlertCircle } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Dialog for confirming overwriting current form inputs
 *
 * Gets data from centralized dialog state
 *
 * @example
 * In a component using useGlobalDialog hook:
 * const { openReplaceInputsDialog } = useGlobalDialog();
 * openReplaceInputsDialog({
 *   onConfirm: handleReplace,
 *   onCancel: handleCancel,
 * });
 */
function ReplaceInputsDialogContent() {
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  const title = useMemo(
    () => dialog?.data?.title || 'Replace current inputs?',
    [dialog?.data?.title],
  );
  const description = useMemo(
    () => dialog?.data?.description || 'Loading a test case will overwrite your current inputs.',
    [dialog?.data?.description],
  );
  const confirmText = useMemo(
    () => dialog?.data?.confirmText || 'Replace',
    [dialog?.data?.confirmText],
  );
  const cancelText = useMemo(
    () => dialog?.data?.cancelText || 'Cancel',
    [dialog?.data?.cancelText],
  );
  const onConfirm = useMemo(() => dialog?.data?.onConfirm, [dialog?.data?.onConfirm]);
  const onCancel = useMemo(() => dialog?.data?.onCancel, [dialog?.data?.onCancel]);
  const isClosingRef = useRef(false);

  // Reset closing flag when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      isClosingRef.current = false;
    }
  }, [isDialogOpen]);

  const handleConfirmClick = useCallback(async () => {
    if (isClosingRef.current) return;

    if (!onConfirm) {
      isClosingRef.current = true;
      onClose();
      return;
    }

    try {
      const result = onConfirm();
      isClosingRef.current = true;
      onClose();

      // Handle async operations in background
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      logger.error('Replace action failed:', error);
      // Keep dialog open on error
      isClosingRef.current = false;
    }
  }, [onConfirm, onClose]);

  const handleCancelClick = useCallback(async () => {
    if (isClosingRef.current) return;

    try {
      if (onCancel) {
        await onCancel();
      }
      isClosingRef.current = true;
      onClose();
    } catch (error) {
      logger.error('Cancel action failed:', error);
      isClosingRef.current = true;
      onClose();
    }
  }, [onCancel, onClose]);

  const handleBackdropChange = useCallback(
    (newOpen) => {
      // Prevent reopening if we're in the middle of closing
      if (isClosingRef.current && newOpen) {
        return;
      }

      if (!newOpen) {
        isClosingRef.current = true;
        onClose();
      }
    },
    [onClose],
  );

  if (!isDialogOpen) {
    return null;
  }

  return (
    <AlertDialog.Backdrop
      isOpen={true}
      onOpenChange={handleBackdropChange}
      variant="opaque"
      isDismissable={false}
      isKeyboardDismissDisabled
      className="bg-black/20 backdrop-blur-sm"
    >
      <AlertDialog.Container placement="center" size="sm" className="max-w-sm">
        <AlertDialog.Dialog
          aria-label={title}
          className="bg-(--color-bg) border border-(--color-border-strong) rounded-lg shadow-(--shadow-md) p-5"
        >
          <AlertDialog.Header>
            <AlertDialog.Icon
              status="accent"
              className="w-10 h-10 bg-(--color-accent-light) rounded-full flex items-center justify-center text-(--color-accent) mx-auto mb-3"
            >
              <AlertCircle size={20} />
            </AlertDialog.Icon>
            <AlertDialog.Heading className="text-base font-semibold text-(--color-text-primary) text-center mb-1">
              {title}
            </AlertDialog.Heading>
          </AlertDialog.Header>

          <div className="border-t border-(--color-border) my-4"></div>

          <AlertDialog.Body className="text-sm text-(--color-text-secondary) text-center leading-relaxed">
            {description}
          </AlertDialog.Body>

          <AlertDialog.Footer className="flex gap-3 mt-5">
            <Button variant="dialog-secondary" onPress={handleCancelClick} className="flex-1">
              {cancelText}
            </Button>
            <Button variant="dialog-primary" onPress={handleConfirmClick} className="flex-1">
              {confirmText}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

// Memoized to prevent duplicate renders from DialogManager
const MemoizedContent = React.memo(ReplaceInputsDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
export const ReplaceInputsDialog = React.memo(function ReplaceInputsDialog() {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed - this is critical for preventing double-render issues
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="replace-inputs-dialog" />;
});

ReplaceInputsDialog.propTypes = {};
