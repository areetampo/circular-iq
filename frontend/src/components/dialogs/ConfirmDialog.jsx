/**
 * Reusable Confirmation Dialog (Now uses centralized dialog state)
 * AlertDialog-based confirmation dialog using HeroUI v3 compound syntax
 *
 * Now uses centralized dialog state via useGlobalDialog()
 *
 * Location: src/components/dialogs/ConfirmDialog.jsx
 */

import { AlertDialog } from '@heroui/react';
import { AlertCircle, TriangleAlert } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Reusable confirmation dialog
 *
 * Gets all data from centralized dialog state via DialogManager
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
export function ConfirmDialog({
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
  const buttonVariant = variant === 'destructive' ? 'danger' : 'primary';
  const icon = variant === 'destructive' ? <TriangleAlert /> : <AlertCircle />;
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
    <AlertDialog.Backdrop
      isOpen={isDialogOpen}
      onOpenChange={handleBackdropChange}
      variant="opaque"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <AlertDialog.Container size="md" placement="center">
        <AlertDialog.Dialog aria-label={title}>
          <AlertDialog.Header>
            <AlertDialog.Icon status={status}>{icon}</AlertDialog.Icon>
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>

          <AlertDialog.Body>{description && <p>{description}</p>}</AlertDialog.Body>

          <AlertDialog.Footer>
            <Button variant="tertiary" onPress={handleCancelClick} isDisabled={isLoading}>
              {cancelText}
            </Button>
            <Button variant={buttonVariant} onPress={handleConfirmClick} isLoading={isLoading}>
              {confirmText}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
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
