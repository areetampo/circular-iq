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

import { AlertDialog, FieldError, Input, Label, TextField } from '@heroui/react';
import { Save } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common';
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
      const trimmedName = name.trim();

      if (!trimmedName) {
        setError('please enter an assessment name');
        return;
      }

      if (trimmedName.length < 3) {
        setError('must be at least 3 characters');
        return;
      }

      if (trimmedName.length > 50) {
        setError('must be less than 50 characters');
        return;
      }

      setError('');
      setIsSubmitting(true);
      try {
        if (onSave) {
          // Let caller throw on validation/server errors so we can show message in-dialog
          await onSave({
            name: trimmedName,
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
    <AlertDialog>
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
                  <AlertDialog.Icon
                    status="success"
                    className="alert-dialog__icon alert-dialog__icon--success"
                  >
                    <Save size={20} />
                  </AlertDialog.Icon>
                  <AlertDialog.Heading>Save Assessment</AlertDialog.Heading>
                </AlertDialog.Header>

                <AlertDialog.Body className="text-sm">
                  <TextField isInvalid={!!error}>
                    <div>
                      <Label>Name</Label>
                      {error && <FieldError>{error}</FieldError>}
                    </div>
                    <Input
                      placeholder="e.g., Recycled Plastic Packaging Project"
                      value={name}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow up to 50 characters + whitespace for trimming
                        if (value.length <= 50) {
                          setName(value);
                          setError('');
                        }
                      }}
                      maxLength={50}
                      spellCheck={false}
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                    <div className="mt-1 pl-2 text-[0.65rem] font-medium text-(--color-text-muted)">
                      {name.trim().length}/50 characters (min req: 3)
                    </div>
                  </TextField>
                </AlertDialog.Body>

                <AlertDialog.Footer>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      close();
                      onClose();
                    }}
                    isDisabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="teal"
                    onPress={() => {
                      if (!isSubmitting) handleSubmit(close);
                    }}
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </AlertDialog.Footer>
              </>
            )}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

SaveAssessmentDialogContent.propTypes = {
  defaultName: PropTypes.string,
  scoringResult: PropTypes.object,
};

// Memoized content to prevent duplicate renders
const MemoizedContent = React.memo(SaveAssessmentDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
export default function SaveAssessmentDialog({ defaultName = '', scoringResult = null }) {
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
