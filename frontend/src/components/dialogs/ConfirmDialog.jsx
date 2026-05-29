/** Generic AlertDialog confirmation opened via `openConfirmDialog`. */

import { AlertDialog } from '@heroui/react';
import { AlertCircle, TriangleAlert } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Renders a default or destructive confirmation dialog from `DialogManager` data.
 * Async confirm handlers run after the dialog begins closing; failures reset the closing guard.
 */
export default function ConfirmDialog({
  title = 'Confirm',
  description = 'Confirm your action',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm = null,
  variant = 'default', // 'default' or 'destructive'
  isLoading = false,
}) {
  const { isDialogOpen, onClose } = useGlobalDialog();

  const status = variant === 'destructive' ? 'danger' : 'accent';
  const isClosingRef = useRef(false);

  // A fresh open must allow cancel/confirm handlers after the previous close cycle finished.
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

      isClosingRef.current = true;
      onClose();

      // Long-running confirmations should not keep the modal visually stuck open.
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      logger.error('[CONFIRM_DIALOG_ERROR]', error);
      // Allow another attempt if the background confirmation fails.
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
    // HeroUI can emit a transient reopen during close animation; ignore that edge.
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
