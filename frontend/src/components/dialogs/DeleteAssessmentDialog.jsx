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
function DeleteAssessmentDialogContent({ assessmentTitle = '' }) {
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
      className="backdrop-blur-sm bg-(--color-backdrop)"
    >
      <AlertDialog.Container placement="center" size="sm" className="max-w-sm">
        <AlertDialog.Dialog className="bg-(--color-bg) border border-(--color-border-strong) rounded-(--radius-lg) shadow-(--shadow-md) p-5">
          {({ close }) => (
            <>
              {/* Icon */}
              <div className="w-10 h-10 bg-[rgba(139,58,58,0.1)] rounded-full flex items-center justify-center text-(--color-error) mx-auto mb-3">
                <Trash2 size={18} />
              </div>
              {/* Title */}
              <h2 className="text-base font-semibold text-(--color-text-primary) text-center mb-1">
                Delete Assessment?
              </h2>
              {/* Body */}
              <div className="border-t border-(--color-border) my-4" />
              <p className="text-sm text-(--color-text-secondary) text-center leading-relaxed mb-5">
                This will permanently delete{' '}
                <span className="font-medium text-(--color-text-primary)">
                  &ldquo;{assessmentTitle}&rdquo;
                </span>
                . This action cannot be undone.
              </p>
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={close}
                  className="flex-1 border border-(--color-border-strong) text-(--color-text-secondary) rounded-md py-2.5 text-sm hover:bg-(--color-accent-light) transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    close();
                  }}
                  className="flex-1 bg-(--color-error) text-white rounded-md py-2.5 text-sm hover:opacity-90 transition-opacity"
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
  assessmentTitle: PropTypes.string,
};

// Memoized content to prevent duplicate renders
const MemoizedContent = React.memo(DeleteAssessmentDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
export const DeleteAssessmentDialog = React.memo(function DeleteAssessmentDialog({
  assessmentTitle = '',
}) {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed to prevent dialog from mounting
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="delete-assessment-dialog" assessmentTitle={assessmentTitle} />;
});

DeleteAssessmentDialog.propTypes = {
  assessmentTitle: PropTypes.string,
};
