/**
 * Save Assessment Dialog
 * Specialized dialog for saving assessments with a name
 * Wraps InputDialog with specific validation and messaging
 *
 * Location: src/components/dialogs/SaveAssessmentDialog.jsx
 */

import { React } from 'react';
import PropTypes from 'prop-types';
import { InputDialog } from './InputDialog';

/**
 * Specialized dialog for saving assessments with a name
 *
 * @example
 * <SaveAssessmentDialog
 *   open={showSave}
 *   onOpenChange={setShowSave}
 *   defaultName="Untitled Assessment"
 *   onSave={(name) => {
 *     console.log('Saving assessment with name:', name);
 *   }}
 * />
 */
export function SaveAssessmentDialog({ open, onOpenChange, onSave, defaultName = '' }) {
  const validateName = (name) => {
    const trimmed = name.trim();

    if (!trimmed) {
      return 'Assessment name is required';
    }

    if (trimmed.length < 3) {
      return 'Assessment name must be at least 3 characters';
    }

    if (trimmed.length > 100) {
      return 'Assessment name must be less than 100 characters';
    }

    return null;
  };

  return (
    <InputDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save Assessment"
      description="Give your assessment a memorable name"
      inputLabel="Assessment Name"
      inputPlaceholder="e.g., Recycled Plastic Packaging Project"
      defaultValue={defaultName}
      onSubmit={onSave}
      submitText="Save"
      cancelText="Cancel"
      validate={validateName}
      maxLength={100}
    />
  );
}

SaveAssessmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  defaultName: PropTypes.string,
};
