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
      className="bg-black/20 backdrop-blur-sm"
    >
      <AlertDialog.Container placement="center" size="sm" className="max-w-sm">
        <AlertDialog.Dialog className="bg-(--color-bg-elevated) border border-(--color-border) rounded-3xl shadow-(--shadow-md) p-6">
          {({ close }) => (
            <>
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  variant === 'destructive'
                    ? 'bg-(--color-error-light) text-(--color-error)'
                    : 'bg-(--color-accent-light) text-(--color-accent)'
                }`}
              >
                {variant === 'destructive' ? (
                  <TriangleAlert size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>
              {/* Title */}
              <h2 className="font-(--font-display) text-[18px] text-(--color-text-primary) text-center tracking-[-0.02em] mb-2">
                {title}
              </h2>
              {/* Body */}
              <div className="border-t border-(--color-border) my-4" />
              <p className="text-[13px] text-(--color-text-secondary) text-center leading-relaxed mb-6">
                {description}
              </p>
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelClick}
                  className="flex-1 border border-(--color-border-strong) text-(--color-text-secondary) rounded-2xl py-2.5 text-[13px] font-semibold hover:bg-(--color-accent-light) transition-colors"
                  disabled={isLoading}
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirmClick}
                  className={`flex-1 rounded-2xl py-2.5 text-[13px] font-semibold transition-opacity ${
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
