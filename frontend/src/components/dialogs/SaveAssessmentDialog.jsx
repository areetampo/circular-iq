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
 *   onSave: async (name, isPublic, contributeToGlobalBenchmarks) => { ... },
 * });
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Switch, Input, Label, Description } from '@heroui/react';
import { Button } from '@/components/common';
import { cn } from '@/utils/cn';
import { Globe, Save } from 'lucide-react';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Content component for save assessment dialog
 * Gets data from centralized dialog state (DialogManager passes defaultName prop)
 */
function SaveAssessmentDialogContent({ defaultName = '' }) {
  // Note: defaultName prop validation handled by wrapper component
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  const [name, setName] = useState(defaultName);
  const [isPublic, setIsPublic] = useState(false);
  const [contributeToGlobalBenchmarks, setContributeToGlobalBenchmarks] = useState(true);
  const [error, setError] = useState('');

  // Get callback from dialog data with stable reference
  const onSave = useMemo(() => dialog?.data?.onSave, [dialog?.data?.onSave]);

  useEffect(() => {
    if (isDialogOpen) {
      setName(defaultName);
      setIsPublic(false);
      setContributeToGlobalBenchmarks(true);
      setError('');
    }
  }, [isDialogOpen, defaultName]);

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

      try {
        if (onSave) {
          await onSave(name.trim(), isPublic, contributeToGlobalBenchmarks);
        }
        close();
      } catch (err) {
        setError(err?.message || 'Failed to save assessment');
      }
    },
    [name, isPublic, contributeToGlobalBenchmarks, onSave],
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
    >
      <AlertDialog.Container placement="center" size="lg">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status="success">
                  <Save className="w-6 h-6" />
                </AlertDialog.Icon>
                <AlertDialog.Heading>Save Assessment</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="gap-6">
                <p className="text-sm text-gray-600">
                  Give your assessment a memorable name and choose your privacy settings
                </p>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Assessment Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Recycled Plastic Packaging Project"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    maxLength={100}
                    className={cn('w-4/5 sm:w-3/5', error && 'border-red-600 focus:ring-red-600')}
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="space-y-3">
                  {/* Public Access Toggle */}
                  <div className="flex items-center justify-between gap-3 p-4 border-2 border-emerald-200 rounded-lg bg-emerald-50">
                    <div className="flex-1">
                      <Switch isSelected={isPublic} onChange={setIsPublic} size="lg">
                        <div className="flex gap-3">
                          <div className="-mt-0.5 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium text-gray-900">
                                Public Access
                              </Label>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                            </div>
                            <Description className="text-xs text-gray-700">
                              Make this assessment publicly viewable.{' '}
                              <span className="italic font-semibold">
                                Share link available on your assessments page once saved.
                              </span>
                            </Description>
                          </div>
                        </div>
                      </Switch>
                    </div>
                  </div>

                  {/* Contribute to Global Benchmarks Toggle */}
                  <div className="flex items-center justify-between gap-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex-1">
                      <Switch
                        isSelected={contributeToGlobalBenchmarks}
                        onChange={setContributeToGlobalBenchmarks}
                        size="lg"
                      >
                        <div className="flex gap-3">
                          <div className="-mt-0.5 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Globe className="w-5 h-5 text-blue-600 shrink-0" />
                              <Label className="text-sm font-medium text-gray-900">
                                Global Benchmarks
                              </Label>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                            </div>
                            <Description className="text-xs text-gray-700">
                              Allow your anonymized score to contribute to industry-wide benchmarks.
                            </Description>
                          </div>
                        </div>
                      </Switch>
                    </div>
                  </div>
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer>
                <Button
                  variant="neutral-soft"
                  onPress={() => {
                    close();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onPress={() => {
                    handleSubmit(close);
                  }}
                >
                  Save Assessment
                </Button>
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
};

// Memoized content to prevent duplicate renders
const MemoizedContent = React.memo(SaveAssessmentDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
export function SaveAssessmentDialog({ defaultName = '' }) {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed to prevent AlertDialog from mounting
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="save-assessment-dialog" defaultName={defaultName} />;
}

SaveAssessmentDialog.propTypes = {
  defaultName: PropTypes.string,
};

export default SaveAssessmentDialog;
