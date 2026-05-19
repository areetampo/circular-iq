/**
 * @module RenameAssessmentDialog
 * @description Rename a saved assessment title with validation (3–50 characters).
 *
 * @example
 * In a component using useGlobalDialog hook:
 * const { openRenameAssessmentDialog } = useGlobalDialog();
 * openRenameAssessmentDialog({
 *   defaultName: 'Current Name',
 *   onRename: async (newName) => { ... },
 * });
 */

import { AlertDialog, FieldError, Input, Label, TextField } from '@heroui/react';
import { Pencil } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Rename dialog; `onRename` is read from `dialog.data` set by `openRenameAssessmentDialog`.
 *
 * @param {Object} props
 * @param {string} [props.defaultName=''] - Current title prefilled in the input.
 * @returns {import('react').ReactElement|null}
 */
export default function RenameAssessmentDialog({ defaultName = '' }) {
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get callback from dialog data with stable reference
  const onRename = dialog?.data?.onRename;

  useEffect(() => {
    if (isDialogOpen) {
      setName(defaultName);
      setError('');
      setIsSubmitting(false);
    }
  }, [isDialogOpen, defaultName]);

  const validateName = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'assessment name is required';
    }

    if (trimmed.length < 3) {
      return 'must be at least 3 characters';
    }

    if (trimmed.length > 50) {
      return 'must be less than 50 characters';
    }

    return null;
  };

  const handleSubmit = useCallback(
    async (close) => {
      const validationError = validateName(name);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError('');
      setIsSubmitting(true);
      try {
        if (onRename) {
          await onRename(name.trim());
        }
        close();
      } catch (err) {
        setError(err?.message || 'Rename failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, dialog?.data?.onRename],
  );

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={isDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose();
          }
        }}
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
                    status="warning"
                    className="alert-dialog__icon alert-dialog__icon--warning"
                  >
                    <Pencil size={20} />
                  </AlertDialog.Icon>
                  <AlertDialog.Heading>Rename Assessment</AlertDialog.Heading>
                </AlertDialog.Header>

                <AlertDialog.Body className="space-y-4">
                  <TextField isInvalid={!!error}>
                    <div>
                      <Label>New Name</Label>
                      {error && <FieldError>{error}</FieldError>}
                    </div>
                    <Input
                      id="assessment-name"
                      value={name}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow up to 50 characters + whitespace for trimming
                        if (value.length <= 50) {
                          setName(value);
                          setError('');
                        }
                      }}
                      placeholder="Enter assessment name"
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
                    onPress={() => close()}
                    isDisabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onPress={() => handleSubmit(close)}
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                    className="flex-1"
                  >
                    Rename
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

RenameAssessmentDialog.propTypes = {
  defaultName: PropTypes.string,
};
