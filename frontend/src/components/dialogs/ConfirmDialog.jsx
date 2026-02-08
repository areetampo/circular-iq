/**
 * Reusable Confirmation Dialog (Legacy)
 * AlertDialog-based confirmation dialog using HeroUI v3 compound syntax
 *
 * Note: For new implementations, consider creating a custom dialog with better status support
 *
 * Location: src/components/dialogs/ConfirmDialog.jsx
 */

import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Button } from '@heroui/react';
import { AlertCircle, TriangleAlert } from 'lucide-react';

/**
 * Reusable confirmation dialog (legacy)
 *
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Assessment?"
 *   description="This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   onConfirm={handleDelete}
 *   variant="destructive"
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default', // 'default' | 'destructive'
  isLoading = false,
}) {
  const status = variant === 'destructive' ? 'danger' : 'default';
  const buttonVariant = variant === 'destructive' ? 'danger' : 'primary';
  const icon = variant === 'destructive' ? <TriangleAlert /> : <AlertCircle />;
  const isClosingRef = useRef(false);

  console.log('[CONFIRM_DIALOG_RENDER]', { open, title, isLoading });

  // Reset closing flag when dialog opens
  useEffect(() => {
    if (open) {
      console.log('[DIALOG_OPENED_RESET_CLOSING_FLAG]');
      isClosingRef.current = false;
    }
  }, [open]);

  const handleConfirmClick = async () => {
    console.log('[CONFIRM_BUTTON_CLICKED]');

    if (isClosingRef.current) {
      console.log('[ALREADY_CLOSING_IGNORE]');
      return;
    }

    if (!onConfirm) {
      console.log('[NO_CONFIRM_CALLBACK]');
      isClosingRef.current = true;
      onOpenChange(false);
      return;
    }

    try {
      console.log('[CALLING_CONFIRM_CALLBACK]');
      const result = onConfirm();

      // Close dialog immediately
      console.log('[CLOSING_DIALOG_VIA_ONOPEN_CHANGE]');
      isClosingRef.current = true;
      onOpenChange(false);

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
    onOpenChange(false);
  };

  const handleBackdropChange = (newOpen) => {
    console.log('[BACKDROP_ONOPEN_CHANGE]', {
      newOpen,
      currentOpen: open,
      isClosing: isClosingRef.current,
    });

    // Prevent reopening if we're in the middle of closing
    if (isClosingRef.current && newOpen) {
      console.log('[BLOCKED_REOPEN_DURING_CLOSE]');
      return;
    }

    if (!newOpen) {
      isClosingRef.current = true;
    }

    onOpenChange(newOpen);
  };

  return (
    <AlertDialog.Backdrop
      isOpen={open}
      onOpenChange={handleBackdropChange}
      variant="opaque"
      isDismissable={!isLoading}
      isKeyboardDismissDisabled={isLoading}
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
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'destructive']),
  isLoading: PropTypes.bool,
};
