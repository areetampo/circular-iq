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
import React, { useEffect, useRef } from 'react';

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

  console.log('[CONFIRM_DIALOG_RENDER]', { isDialogOpen, title, isLoading });

  // Reset closing flag when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      console.log('[DIALOG_OPENED_RESET_CLOSING_FLAG]');
      isClosingRef.current = false;
    }
  }, [isDialogOpen]);

  const handleConfirmClick = async () => {
    console.log('[CONFIRM_BUTTON_CLICKED]');

    if (isClosingRef.current) {
      console.log('[ALREADY_CLOSING_IGNORE]');
      return;
    }

    if (!onConfirm) {
      console.log('[NO_CONFIRM_CALLBACK]');
      isClosingRef.current = true;
      onClose();
      return;
    }

    try {
      console.log('[CALLING_CONFIRM_CALLBACK]');
      const result = onConfirm();

      // Close dialog immediately
      console.log('[CLOSING_DIALOG_VIA_ONCLOSE]');
      isClosingRef.current = true;
      onClose();

      // Handle async operations in background
      if (result instanceof Promise) {
        await result;
        console.log('[CALLBACK_COMPLETE]');
      }
    } catch (error) {
      console.error('[CALLBACK_ERROR]', error);
      // Keep dialog open on error
      console.log('[ERROR_KEEPING_DIALOG_OPEN]');
      isClosingRef.current = false;
    }
  };

  const handleCancelClick = () => {
    console.log('[CANCEL_BUTTON_CLICKED]');
    if (isClosingRef.current) {
      console.log('[ALREADY_CLOSING_IGNORE]');
      return;
    }
    isClosingRef.current = true;
    onClose();
  };

  const handleBackdropChange = (newOpen) => {
    console.log('[BACKDROP_ONOPEN_CHANGE]', {
      newOpen,
      currentOpen: isDialogOpen,
      isClosing: isClosingRef.current,
    });

    // Prevent reopening if we're in the middle of closing
    if (isClosingRef.current && newOpen) {
      console.log('[BLOCKED_REOPEN_DURING_CLOSE]');
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
            <Button
              variant={buttonVariant}
              color={buttonVariant === 'danger' ? 'danger' : undefined}
              onPress={handleConfirmClick}
              isLoading={isLoading}
            >
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
