/**
 * Rename Assessment Dialog
 * Specialized dialog for renaming assessments
 * Uses HeroUI v3 AlertDialog compound syntax
 *
 * Now uses centralized dialog state via useGlobalDialog()
 *
 * Location: src/components/dialogs/RenameAssessmentDialog.jsx
 *
 * @example
 * In a component using useGlobalDialog hook:
 * const { openRenameAssessmentDialog } = useGlobalDialog();
 * openRenameAssessmentDialog({
 *   defaultName: 'Current Name',
 *   onRename: async (newName) => { ... },
 * });
 */

import { AlertDialog, Input, Label } from '@heroui/react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Specialized dialog for renaming assessments
 *
 * Gets data from centralized dialog state (DialogManager passes defaultName prop)
 */
export function RenameAssessmentDialog({ defaultName = '' }) {
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');

  // Get callbacks from dialog data
  const onRename = dialog?.data?.onRename;
  const isLoading = dialog?.data?.isLoading || false;

  useEffect(() => {
    if (isDialogOpen) {
      setName(defaultName);
      setError('');
    }
  }, [isDialogOpen, defaultName]);

  const validateName = (value) => {
    const trimmed = value.trim();

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

  const handleSubmit = async (close) => {
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (onRename) {
        await onRename(name.trim());
      }
      close();
    } catch (err) {
      setError(err?.message || 'Rename failed. Please try again.');
    }
  };

  return (
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
                <AlertDialog.Heading>Rename Assessment</AlertDialog.Heading>
                <AlertDialog.Description className="text-[12px] text-(--color-text-muted) mt-1">
                  Enter a new name for this assessment
                </AlertDialog.Description>
              </AlertDialog.Header>

              <AlertDialog.Body className="space-y-4">
                <div>
                  <Label
                    htmlFor="assessment-name"
                    className="text-[11px] font-semibold uppercase tracking-widest text-(--color-text-secondary)"
                  >
                    Assessment Name
                  </Label>
                  <Input
                    id="assessment-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter assessment name"
                    className="w-full mt-2"
                    isInvalid={!!error}
                    errorMessage={error}
                  />
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer className="flex gap-3 pt-2">
                <Button
                  variant="tertiary"
                  onPress={() => close()}
                  isDisabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={() => handleSubmit(close)}
                  isLoading={isLoading}
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
  );
}

RenameAssessmentDialog.propTypes = {
  defaultName: PropTypes.string,
};
