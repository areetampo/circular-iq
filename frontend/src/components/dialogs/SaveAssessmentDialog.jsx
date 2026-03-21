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
import { Save } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common';
import ChoiceCardSwitch from '@/components/common/ChoiceCardSwitch';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { cn } from '@/utils/cn';

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
    >
      <AlertDialog.Container placement="center" size="lg">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status="success">
                  <Save size={25} />
                </AlertDialog.Icon>
                <AlertDialog.Heading>Save Assessment</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body>
                <Label htmlFor="name" className="text-sm text-slate-500 font-medium">
                  Give your assessment a memorable name and choose your privacy settings
                </Label>
                <div className="flex flex-col items-center gap-2 mt-2 mb-3 px-2">
                  <Input
                    id="name"
                    placeholder="e.g., Recycled Plastic Packaging Project"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    maxLength={100}
                    className={cn(
                      'rounded-full',
                      error && 'border-red-600 focus:ring-red-600',
                      'text-xs xs:text-sm',
                    )}
                    fullWidth
                  />

                  {error && <p className="text-sm text-red-600">{error}</p>}
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

              <AlertDialog.Footer>
                <Button
                  variant="neutral-soft"
                  onPress={() => {
                    close();
                    onClose();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onPress={() => {
                    if (!isSubmitting) handleSubmit(close);
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
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
