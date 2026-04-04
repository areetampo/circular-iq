/**
 * Save Assessment Dialog
 * Specialized dialog for saving assessments with a name
 * Uses HeroUI v3 AlertDialog compound syntax
 *
 * Now uses centralized dialog state via useGlobalDialog()
 *
 * Location: src/components/dialogs/SaveAssessmentDialog.jsx
 *
 * @example
 * In a component using useGlobalDialog hook:
 * const { openSaveAssessmentDialog } = useGlobalDialog();
 * openSaveAssessmentDialog({
 *   defaultName: 'Untitled Assessment',
 *   onSave: async (data) => { ... }, // data contains: name, industry, isPublic, contributeToGlobalBenchmarks, scoringResult
 * });
 */

import { AlertDialog, Input } from '@heroui/react';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Content component for save assessment dialog
 * Gets data from centralized dialog state (DialogManager passes defaultName prop)
 */
function SaveAssessmentDialogContent({ defaultName = '', scoringResult = null }) {
  // Note: defaultName prop validation handled by wrapper component
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  const [name, setName] = useState(defaultName);
  const [industry, setIndustry] = useState(scoringResult?.metadata?.industry ?? '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get callback from dialog data with stable reference
  const onSave = useMemo(() => dialog?.data?.onSave, [dialog?.data?.onSave]);

  useEffect(() => {
    if (isDialogOpen) {
      setName(defaultName);
      setIndustry(scoringResult?.metadata?.industry ?? '');
      setError('');
      setIsSubmitting(false);
    }
  }, [isDialogOpen, defaultName, scoringResult]);

  const handleBackdropChange = useCallback(
    (isOpen) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSubmit = useCallback(
    async (close) => {
      if (!name.trim()) {
        setError('Please enter an assessment name');
        return;
      }

      if (name.trim().length < 3) {
        setError('Assessment name must be at least 3 characters');
        return;
      }

      if (name.trim().length > 100) {
        setError('Assessment name must be less than 100 characters');
        return;
      }

      setError('');
      setIsSubmitting(true);
      try {
        if (onSave) {
          // Let caller throw on validation/server errors so we can show message in-dialog
          await onSave({
            name: name.trim(),
            industry,
            isPublic: true,
            contributeToGlobalBenchmarks: true,
            scoringResult,
          });
        }
        close();
      } catch (err) {
        // Surface the error inside the dialog instead of using a toast
        setError(err?.message || 'Failed to save assessment');
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, onSave],
  );

  // Only render when dialog is actually open
  if (!isDialogOpen) {
    return null;
  }

  return (
    <AlertDialog.Backdrop
      isOpen={true}
      onOpenChange={handleBackdropChange}
      variant="opaque"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      className=""
    >
      <AlertDialog.Container placement="center" size="sm">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Heading>Save Assessment</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="text-sm">
                {/* Name input */}
                <div className="mb-4">
                  <label className="text-xs font-semibold uppercase tracking-widest text-(--color-text-secondary) mb-1.5 block">
                    Name
                  </label>
                  <Input
                    placeholder="e.g., Recycled Plastic Packaging Project"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    maxLength={100}
                    className="w-full bg-transparent border border-(--color-border-strong) rounded-lg px-4 py-2.5 text-sm text-(--color-text-primary) focus:border-(--color-accent) focus:outline-none transition-colors"
                    fullWidth
                  />
                  {error && <p className="text-xs text-(--color-error) mt-1">{error}</p>}
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer className="flex gap-3">
                <button
                  onClick={() => {
                    close();
                    onClose();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 border border-(--color-border-strong) text-(--color-text-secondary) rounded-lg py-2.5 text-sm hover:bg-(--color-accent-light) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!isSubmitting) handleSubmit(close);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-(--color-accent) text-white rounded-lg py-2.5 text-sm hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Assessment'}
                </button>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

SaveAssessmentDialogContent.propTypes = {
  defaultName: PropTypes.string,
  scoringResult: PropTypes.object,
};

// Memoized content to prevent duplicate renders
const MemoizedContent = React.memo(SaveAssessmentDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
export function SaveAssessmentDialog({ defaultName = '', scoringResult = null }) {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed to prevent AlertDialog from mounting
  if (!isDialogOpen) {
    return null;
  }

  return (
    <MemoizedContent
      key="save-assessment-dialog"
      defaultName={defaultName}
      scoringResult={scoringResult}
    />
  );
}

SaveAssessmentDialog.propTypes = {
  defaultName: PropTypes.string,
  scoringResult: PropTypes.object,
};

export default SaveAssessmentDialog;
