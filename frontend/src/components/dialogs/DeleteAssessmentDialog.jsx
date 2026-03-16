/**
 * Delete Assessment Dialog
 * Specialized dialog for confirming assessment deletion
 * Wraps ConfirmDialog with specific messaging and styling
 *
 * Now uses centralized dialog state via useGlobalDialog()
 *
 * Location: src/components/dialogs/DeleteAssessmentDialog.jsx
 *
 * @example
 * In a component using useGlobalDialog hook:
 * const { openDeleteAssessmentDialog } = useGlobalDialog();
 * openDeleteAssessmentDialog({
 *   assessmentName: 'My Assessment',
 *   onConfirm: handleDelete,
 * });
 */

import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';

import { useGlobalDialog } from '@/contexts/DialogContext';

import { ConfirmDialog } from './ConfirmDialog';

/**
 * Specialized dialog for confirming assessment deletion
 *
 * Gets data from centralized dialog state (DialogManager passes assessmentName prop)
 */
function DeleteAssessmentDialogContent({ assessmentName = '' }) {
  // Note: assessmentName prop validation handled by wrapper component
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

  const description = useMemo(() => {
    return assessmentName
      ? `Are you sure you want to delete "${assessmentName}"? This action cannot be undone.`
      : 'Are you sure you want to delete this assessment? This action cannot be undone.';
  }, [assessmentName]);

  if (!isDialogOpen) {
    return null;
  }

  return (
    <ConfirmDialog
      open={true}
      onOpenChange={handleOpenChange}
      title="Delete Assessment?"
      description={description}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
      isLoading={isLoading}
    />
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

  // Return null when closed to prevent ConfirmDialog from mounting
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="delete-assessment-dialog" assessmentName={assessmentName} />;
});

DeleteAssessmentDialog.propTypes = {
  assessmentName: PropTypes.string,
};
