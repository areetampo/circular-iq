/**
 * Delete Assessment Dialog
 * Specialized dialog for confirming assessment deletion
 * Wraps ConfirmDialog with specific messaging and styling
 *
 * Location: src/components/dialogs/DeleteAssessmentDialog.jsx
 */

import React from 'react';
import PropTypes from 'prop-types';

import { ConfirmDialog } from './ConfirmDialog';

/**
 * Specialized dialog for confirming assessment deletion
 *
 * @example
 * <DeleteAssessmentDialog
 *   open={showDelete}
 *   onOpenChange={setShowDelete}
 *   assessmentName="My Project Assessment"
 *   onConfirm={handleDelete}
 * />
 */
export function DeleteAssessmentDialog({ open, onOpenChange, assessmentName, onConfirm }) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Assessment?"
      description={
        assessmentName
          ? `Are you sure you want to delete "${assessmentName}"? This action cannot be undone.`
          : 'Are you sure you want to delete this assessment? This action cannot be undone.'
      }
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
}

DeleteAssessmentDialog.propTypes = {
  ...ConfirmDialog.propTypes,
  assessmentName: PropTypes.string,
};
