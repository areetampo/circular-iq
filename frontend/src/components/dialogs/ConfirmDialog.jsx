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
      className="backdrop-blur-sm bg-(--color-backdrop)"
    >
      <AlertDialog.Container placement="center" size="sm" className="max-w-sm">
        <AlertDialog.Dialog className="bg-(--color-bg) border border-(--color-border-strong) rounded-(--radius-lg) shadow-(--shadow-md) p-5">
          {({ close }) => (
            <>
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  variant === 'destructive'
                    ? 'bg-[rgba(139,58,58,0.1)] text-(--color-error)'
                    : 'bg-(--color-accent-light) text-(--color-accent)'
                }`}
              >
                {variant === 'destructive' ? (
                  <TriangleAlert size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </div>
              {/* Title */}
              <h2 className="text-base font-semibold text-(--color-text-primary) text-center mb-1">
                {title}
              </h2>
              {/* Body */}
              <div className="border-t border-(--color-border) my-4" />
              <p className="text-sm text-(--color-text-secondary) text-center leading-relaxed mb-5">
                {description}
              </p>
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelClick}
                  className="flex-1 border border-(--color-border-strong) text-(--color-text-secondary) rounded-md py-2.5 text-sm hover:bg-(--color-accent-light) transition-colors"
                  disabled={isLoading}
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirmClick}
                  className={`flex-1 rounded-md py-2.5 text-sm transition-opacity ${
                    variant === 'destructive'
                      ? 'bg-(--color-error) text-white hover:opacity-90'
                      : 'bg-(--color-accent) text-white hover:opacity-90'
                  }`}
                  disabled={isLoading}
                >
                  {confirmText}
                </button>
              </div>
            </>
          )}
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
