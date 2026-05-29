/** Confirmation dialog for overwriting current landing-page inputs. */

import { AlertDialog } from '@heroui/react';
import { AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Renders replace-input confirmation content supplied by `openReplaceInputsDialog`.
 * Keeps the dialog open if `onConfirm` rejects (async errors reset the closing guard).
 */
function ReplaceInputsDialogContent({
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  const { isDialogOpen, onClose } = useGlobalDialog();

  const isClosingRef = useRef(false);

  // A fresh open must allow cancel/confirm handlers after the previous close cycle finished.
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

      // Long-running confirmations should not keep the modal visually stuck open.
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      logger.error('[DIALOG_REPLACE_INPUTS:CONFIRM_FAILED]', error);
      // Allow another attempt if the background confirmation fails.
      isClosingRef.current = false;
    }
  }, [onConfirm, onClose]);

  const handleCancelClick = useCallback(async () => {
    if (isClosingRef.current) return;

    try {
      if (onCancel) await onCancel();
    } catch (error) {
      logger.error('[DIALOG_REPLACE_INPUTS:CANCEL_FAILED]', error);
    } finally {
      isClosingRef.current = true;
      onClose();
    }
  }, [onCancel, onClose]);

  const handleBackdropChange = useCallback(
    (newOpen) => {
      // HeroUI can emit a transient reopen during close animation; ignore that edge.
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
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={true}
        onOpenChange={handleBackdropChange}
        variant="opaque"
        isDismissable={false}
        isKeyboardDismissDisabled
      >
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog aria-label={title}>
            <AlertDialog.Header>
              <AlertDialog.Icon
                status="warning"
                className="alert-dialog__icon alert-dialog__icon--warning"
              >
                <AlertCircle size={20} />
              </AlertDialog.Icon>
              <AlertDialog.Heading>{title}</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="text-center text-sm/relaxed text-(--color-text-secondary)">
              {description}
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button variant="ghost" onPress={handleCancelClick} className="flex-1">
                {cancelText}
              </Button>
              <Button variant="primary" onPress={handleConfirmClick} className="flex-1">
                {confirmText}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

// PropTypes live on the internal content component and are reused by the memoized shell.
ReplaceInputsDialogContent.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

// AlertDialog content is memoized to avoid duplicate render cycles during open/close transitions.
const MemoizedContent = React.memo(ReplaceInputsDialogContent);

/**
 * Forwards props to replace-input content only while the replace-inputs dialog is open.
 */
const ReplaceInputsDialog = React.memo(function ReplaceInputsDialog(props) {
  const { isDialogOpen } = useGlobalDialog();

  // Closed dialogs stay unmounted so AlertDialog does not keep stale focus state.
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="replace-inputs-dialog" {...props} />;
});

// Keep shell prop validation aligned with the content component.
ReplaceInputsDialog.propTypes = ReplaceInputsDialogContent.propTypes;

export default ReplaceInputsDialog;
