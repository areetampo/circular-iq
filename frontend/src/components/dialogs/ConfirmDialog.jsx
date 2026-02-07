/**
 * Reusable Confirmation Dialog (Legacy)
 * AlertDialog-based confirmation dialog using HeroUI v3 compound syntax
 *
 * Note: For new implementations, use ConfirmationDialog instead for better status support
 *
 * Location: src/components/dialogs/ConfirmDialog.jsx
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Button } from '@heroui/react';
import { useDisclosure } from '@heroui/use-disclosure';
import { AlertCircle, TriangleAlert } from 'lucide-react';

/**
 * Reusable confirmation dialog (legacy - use ConfirmationDialog for new code)
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
}) {
  const { isOpen, onOpenChange: handleOpenChange } = useDisclosure({
    isOpen: open,
    onChange: onOpenChange,
  });

  // Map variant to status and styling
  const status = variant === 'destructive' ? 'danger' : 'default';
  const buttonVariant = variant === 'destructive' ? 'danger' : 'secondary';
  const icon = variant === 'destructive' ? <TriangleAlert /> : <AlertCircle />;

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      variant="opaque"
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <AlertDialog.Container size="md" placement="center">
        <AlertDialog.Dialog aria-label={title}>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status={status}>{icon}</AlertDialog.Icon>
                <AlertDialog.Heading>{title}</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body>{description && <p>{description}</p>}</AlertDialog.Body>

              <AlertDialog.Footer>
                <Button variant="tertiary" onPress={() => close()}>
                  {cancelText}
                </Button>
                <Button
                  variant={buttonVariant === 'danger' ? 'danger' : 'primary'}
                  onPress={() => {
                    onConfirm?.();
                    close();
                  }}
                >
                  {confirmText}
                </Button>
              </AlertDialog.Footer>
            </>
          )}
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
};
