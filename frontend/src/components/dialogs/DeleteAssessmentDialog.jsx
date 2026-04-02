/**
 * Delete Assessment Dialog
 * Specialized dialog for confirming assessment deletion
 * Uses compact dialog pattern with AlertDialog
 *
 * Location: src/components/dialogs/DeleteAssessmentDialog.jsx
 */

import { AlertDialog } from '@heroui/react';
import { Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';

import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Specialized dialog for confirming assessment deletion
 * Uses compact dialog pattern
 */
function DeleteAssessmentDialogContent({ assessmentName = '' }) {
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  // Get callback from dialog data with stable references
  const onConfirm = useMemo(() => dialog?.data?.onConfirm, [dialog?.data?.onConfirm]);
  const isLoading = useMemo(() => dialog?.data?.isLoading || false, [dialog?.data?.isLoading]);

  const handleOpenChange = useCallback(
    (isOpen) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isDialogOpen) {
    return null;
  }

  return (
    <AlertDialog
      isOpen={true}
      onOpenChange={handleOpenChange}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      className="bg-black/20 backdrop-blur-sm"
    >
      <AlertDialog.Container placement="center" size="sm" className="max-w-sm">
        <AlertDialog.Dialog className="bg-(--color-bg-elevated) border border-(--color-border) rounded-3xl shadow-(--shadow-md) p-6">
          {({ close }) => (
            <>
              {/* Icon */}
              <div className="w-12 h-12 bg-(--color-error-light) rounded-2xl flex items-center justify-center text-(--color-error) mx-auto mb-4">
                <Trash2 size={20} />
              </div>
              {/* Title */}
              <h2 className="font-(--font-display) text-[18px] text-(--color-text-primary) text-center tracking-[-0.02em] mb-2">
                Delete Assessment?
              </h2>
              {/* Body */}
              <div className="border-t border-(--color-border) my-4" />
              <p className="text-[13px] text-(--color-text-secondary) text-center leading-relaxed mb-6">
                This will permanently delete{' '}
                <span className="font-semibold text-(--color-text-primary)">
                  &ldquo;{assessmentName}&rdquo;
                </span>
                . This action cannot be undone.
              </p>
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={close}
                  className="flex-1 border border-(--color-border-strong) text-(--color-text-secondary) rounded-2xl py-2.5 text-[13px] font-semibold hover:bg-(--color-accent-light) transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    close();
                  }}
                  className="flex-1 bg-(--color-error) text-white rounded-2xl py-2.5 text-[13px] font-semibold hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog>
  );
}

DeleteAssessmentDialogContent.propTypes = {
  assessmentName: PropTypes.string,
};

// Memoized content to prevent duplicate renders
const MemoizedContent = React.memo(DeleteAssessmentDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
export const DeleteAssessmentDialog = React.memo(function DeleteAssessmentDialog({
  assessmentName = '',
}) {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed to prevent dialog from mounting
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="delete-assessment-dialog" assessmentName={assessmentName} />;
});

DeleteAssessmentDialog.propTypes = {
  assessmentName: PropTypes.string,
};
