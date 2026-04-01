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

import { AlertDialog, Input, Label } from '@heroui/react';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common';
import ChoiceCardSwitch from '@/components/common/ChoiceCardSwitch';
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
  const [isPublic, setIsPublic] = useState(true);
  const [contributeToGlobalBenchmarks, setContributeToGlobalBenchmarks] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get callback from dialog data with stable reference
  const onSave = useMemo(() => dialog?.data?.onSave, [dialog?.data?.onSave]);

  useEffect(() => {
    if (isDialogOpen) {
      setName(defaultName);
      setIndustry(scoringResult?.metadata?.industry ?? '');
      setIsPublic(true);
      setContributeToGlobalBenchmarks(true);
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
            isPublic,
            contributeToGlobalBenchmarks,
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
      className="bg-black/20 backdrop-blur-sm"
    >
      <AlertDialog.Container placement="center" size="sm" className="max-w-sm">
        <AlertDialog.Dialog className="bg-(--color-bg) border border-(--color-border-strong) rounded-lg shadow-(--shadow-md) p-5">
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Heading className="text-base font-semibold text-(--color-text-primary) text-center mb-1">
                  Save Assessment
                </AlertDialog.Heading>
              </AlertDialog.Header>

              <div className="border-t border-(--color-border) my-4"></div>

              <AlertDialog.Body className="text-sm">
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-1.5 block"
                >
                  Name
                </Label>
                <div className="flex flex-col items-center gap-2 mt-1 px-2">
                  <Input
                    id="name"
                    placeholder="e.g., Recycled Plastic Packaging Project"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    maxLength={100}
                    className="bg-(rgba(245,240,232,0.5)) border border-(--color-border-strong) rounded-md px-4 py-2.5 text-sm w-full focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) outline-none"
                    fullWidth
                  />

                  {error && <p className="text-sm mt-2 text-(--color-error)">{error}</p>}
                </div>

                <div className="space-y-3">
                  {/* Public Access Toggle (Choice-card) */}
                  <ChoiceCardSwitch
                    isSelected={isPublic}
                    onChange={setIsPublic}
                    size="lg"
                    variant="emerald"
                    title="Public Access"
                    description={
                      <>
                        Make this assessment publicly viewable.{' '}
                        <span className="italic font-semibold">
                          Share link available on your assessments page once saved.
                        </span>
                      </>
                    }
                  />

                  {/* Global Benchmarks Toggle (Choice-card) */}
                  <ChoiceCardSwitch
                    isSelected={contributeToGlobalBenchmarks}
                    onChange={setContributeToGlobalBenchmarks}
                    size="lg"
                    variant="blue"
                    title="Global Benchmarks"
                    description="Allow your anonymized score to contribute to industry-wide benchmarks."
                  />
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer className="flex gap-3 mt-5">
                <Button
                  variant="dialog-secondary"
                  onPress={() => {
                    close();
                    onClose();
                  }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="dialog-primary"
                  onPress={() => {
                    if (!isSubmitting) handleSubmit(close);
                  }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save Assessment'}
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
