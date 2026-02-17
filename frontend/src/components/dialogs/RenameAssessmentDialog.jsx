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

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Input, Label } from '@heroui/react';
import { Button } from '@/components/common';
import { Edit } from 'lucide-react';
import { cn } from '@/utils/cn';
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
    >
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header className="">
                <AlertDialog.Icon status="default">
                  <Edit className="w-6 h-6" />
                </AlertDialog.Icon>
                <AlertDialog.Heading>Rename Assessment</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="gap-6 pb-4">
                <div className="flex flex-col gap-4 justify-center items-center">
                  <Label
                    htmlFor="assessment-name"
                    className="text-sm font-semibold text-slate-700 leading-relaxed"
                  >
                    Update the assessment name to make it easier to find later.
                  </Label>
                  <Input
                    id="assessment-name"
                    placeholder="e.g., Circular Packaging Review"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    maxLength={100}
                    size="lg"
                    className={cn('w-4/5 sm:w-3/5', error && 'border-red-600 focus:ring-red-600')}
                  />
                  {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer className="gap-3 pt-0">
                <Button
                  variant="neutral-soft"
                  onPress={() => {
                    close();
                    onClose();
                  }}
                  isDisabled={isLoading}
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  variant="info"
                  onPress={() => handleSubmit(close)}
                  isLoading={isLoading}
                  isDisabled={isLoading || name.trim() === (defaultName || '').trim()}
                  size="lg"
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
