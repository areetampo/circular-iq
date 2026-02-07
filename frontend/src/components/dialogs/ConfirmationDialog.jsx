/**
 * Reusable Confirmation Dialog with Status Support
 * Implements HeroUI v3 AlertDialog pattern with proper status variants
 *
 * Features:
 * - Status variants: default, accent, success, warning, danger
 * - Custom icons support
 * - Flexible action buttons
 * - Proper accessibility
 *
 * Location: src/components/dialogs/ConfirmationDialog.jsx
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Button } from '@heroui/react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable confirmation dialog with status support
 *
 * @example
 * // Warning dialog
 * <ConfirmationDialog
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   status="warning"
 *   title="Discard unsaved changes?"
 *   description="You have unsaved changes that will be permanently lost."
 *   confirmText="Discard"
 *   onConfirm={handleDiscard}
 * />
 *
 * @example
 * // Danger dialog with custom icon
 * <ConfirmationDialog
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   status="danger"
 *   icon={<TrashBin />}
 *   title="Delete account?"
 *   description="This will permanently delete your account."
 *   confirmText="Delete Account"
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  status = 'default',
  icon = null,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  placement = 'center',
  size = 'md',
  isDismissable = false,
  isKeyboardDismissDisabled = true,
}) {
  // Default icons based on status if no custom icon provided
  const defaultIcon = icon || <AlertCircle />;

  const getButtonVariant = () => {
    switch (status) {
      case 'danger':
        return 'danger';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'accent':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const handleConfirm = (close) => {
    onConfirm?.();
    close();
  };

  const handleCancel = (close) => {
    onCancel?.();
    close();
  };

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="opaque"
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
    >
      <AlertDialog.Container placement={placement} size={size}>
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status={status}>{defaultIcon}</AlertDialog.Icon>
                <AlertDialog.Heading>{title}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>{description}</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="tertiary" onPress={() => handleCancel(close)}>
                  {cancelText}
                </Button>
                <Button variant={getButtonVariant()} onPress={() => handleConfirm(close)}>
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

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  status: PropTypes.oneOf(['default', 'accent', 'success', 'warning', 'danger']),
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  placement: PropTypes.oneOf(['auto', 'center', 'top', 'bottom']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'cover']),
  isDismissable: PropTypes.bool,
  isKeyboardDismissDisabled: PropTypes.bool,
};
