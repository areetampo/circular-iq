/**
 * @module ConfirmDialog
 * @description Generic AlertDialog confirmation (default or destructive) driven by `openConfirmDialog` payload.
 */

import { AlertDialog } from '@heroui/react';
import { AlertCircle, TriangleAlert } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Renders when `openConfirmDialog` is active; props are supplied by `DialogManager` from dialog data.
 *
 * @param {Object} props
 * @param {string} [props.title='Confirm'] - Dialog title.
 * @param {string} [props.description] - Body copy.
 * @param {string} [props.confirmText='Confirm'] - Primary button label.
 * @param {string} [props.cancelText='Cancel'] - Dismiss button label.
 * @param {Function|null} [props.onConfirm] - Async/sync handler when user confirms.
 * @param {'default'|'destructive'} [props.variant='default'] - Visual style for the confirm action.
 * @param {boolean} [props.isLoading=false] - Disables actions while an operation runs.
 * @returns {import('react').ReactElement|null}
 *
 * @example
 * In pages/components:
 * const { openConfirmDialog } = useGlobalDialog();
 * openConfirmDialog({
 *   title: 'Delete Item?',
 *   description: 'This action cannot be undone.',
 *   confirmText: 'Delete',
 *   cancelText: 'Cancel',
 *   onConfirm: handleDelete,
 *   variant: 'destructive',
 * });
 */
export default function ConfirmDialog({
  title = 'Confirm',
  description = 'Confirm your action',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm = null,
  variant = 'default', // 'default' | 'destructive'
  isLoading = false,
}) {
  const { isDialogOpen, onClose } = useGlobalDialog();

  const status = variant === 'destructive' ? 'danger' : 'accent';
  const isClosingRef = useRef(false);

  // Reset closing flag when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      isClosingRef.current = false;
    }
  }, [isDialogOpen]);

  const handleConfirmClick = async () => {
    if (isClosingRef.current) {
      return;
    }

    if (!onConfirm) {
      isClosingRef.current = true;
      onClose();
      return;
    }

    try {
      const result = onConfirm();

      // Close dialog immediately
      isClosingRef.current = true;
      onClose();

      // Handle async operations in background
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      logger.error('[CONFIRM_DIALOG_ERROR]', error);
      // Keep dialog open on error
      isClosingRef.current = false;
    }
  };

  const handleCancelClick = () => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    onClose();
  };

  const handleBackdropChange = (newOpen) => {
    // Prevent reopening if we're in the middle of closing
    if (isClosingRef.current && newOpen) {
      return;
    }

    if (!newOpen) {
      isClosingRef.current = true;
      onClose();
    }
  };

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={isDialogOpen}
        onOpenChange={handleBackdropChange}
        variant="opaque"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        className=""
      >
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog>
            {() => (
              <>
                <AlertDialog.Header>
                  <AlertDialog.Icon
                    status={status}
                    className={`alert-dialog__icon ${
                      variant === 'destructive'
                        ? 'alert-dialog__icon--danger'
                        : 'alert-dialog__icon--accent'
                    }`}
                  >
                    {variant === 'destructive' ? (
                      <TriangleAlert size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                  </AlertDialog.Icon>
                  <AlertDialog.Heading>{title}</AlertDialog.Heading>
                </AlertDialog.Header>

                <AlertDialog.Body>{description}</AlertDialog.Body>

                <AlertDialog.Footer>
                  <Button variant="ghost" onPress={handleCancelClick} isDisabled={isLoading}>
                    {cancelText}
                  </Button>
                  <Button variant="primary" onPress={handleConfirmClick} isDisabled={isLoading}>
                    {confirmText}
                  </Button>
                </AlertDialog.Footer>
              </>
            )}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

ConfirmDialog.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'destructive']),
  isLoading: PropTypes.bool,
};
