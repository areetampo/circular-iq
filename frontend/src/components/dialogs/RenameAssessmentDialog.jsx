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
      className="bg-black/20 backdrop-blur-sm"
    >
      <AlertDialog.Container placement="center" size="sm" className="max-w-sm">
        <AlertDialog.Dialog className="bg-(--color-bg) border border-(--color-border-strong) rounded-(--radius-lg) shadow-(--shadow-md) p-5">
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Heading className="text-base font-semibold text-(--color-text-primary) text-center mb-1">
                  Rename Assessment
                </AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="text-sm">
                <Label
                  htmlFor="assessment-name"
                  className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-1.5 block"
                >
                  Assessment Name
                </Label>
                <div className="flex flex-col items-center gap-2 mt-2.5 px-2">
                  <Input
                    id="assessment-name"
                    placeholder="e.g., Circular Packaging Review"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    maxLength={100}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm w-full mt-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    fullWidth
                  />

                  {error && <p className="text-sm mt-2 text-red-500">{error}</p>}
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer className="flex gap-3 mt-5">
                <Button
                  variant="dialog-secondary"
                  onPress={() => {
                    close();
                    onClose();
                  }}
                  isDisabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="dialog-primary"
                  onPress={() => handleSubmit(close)}
                  isLoading={isLoading}
                  isDisabled={isLoading || name.trim() === (defaultName || '').trim()}
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
  );
}

RenameAssessmentDialog.propTypes = {
  defaultName: PropTypes.string,
};
