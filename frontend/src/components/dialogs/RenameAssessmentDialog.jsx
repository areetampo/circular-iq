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
import { Edit } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { cn } from '@/utils/cn';

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
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning">
                  <Edit size={25} />
                </AlertDialog.Icon>
                <AlertDialog.Heading>Rename Assessment</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body>
                <Label
                  htmlFor="assessment-name"
                  className="text-sm font-medium"
                  style={{
                    color: 'var(--muted)',
                  }}
                >
                  Update the assessment name to make it easier to find later.
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
                    className={cn(
                      'rounded-lg mb-1',
                      error && 'border-danger focus:ring-danger',
                      'text-xs xs:text-sm',
                    )}
                    fullWidth
                  />

                  {error && (
                    <p className="text-sm mt-2" style={{ color: 'var(--danger)' }}>
                      {error}
                    </p>
                  )}
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer>
                <Button
                  variant="tertiary"
                  onPress={() => {
                    close();
                    onClose();
                  }}
                  isDisabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={() => handleSubmit(close)}
                  isLoading={isLoading}
                  isDisabled={isLoading || name.trim() === (defaultName || '').trim()}
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
