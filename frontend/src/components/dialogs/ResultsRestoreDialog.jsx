/**
 * @module ResultsRestoreDialog
 * @description Offers to restore a prior evaluation session (results snapshot and/or landing inputs).
 */

import { AlertDialog, Checkbox, Label } from '@heroui/react';
import { ExternalLink, FileCheck, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { cleanUrl, formatTimestamp } from '@/lib/formatting';
import { cn } from '@/utils/cn';

/**
 * Session Restore Dialog
 * - Cancel: Dismiss without restoring
 * - Restore Results: Go to /results page with calculated scores
 *
 * NOTE: Inputs are persisted continuously to local storage and will already
 * be present in the LandingPage — the "Restore Inputs" action has been
 * removed because form inputs are now always synced from persisted session.
 * Restore Results remains available when a results snapshot exists.
 */
function ResultsRestoreDialogContent() {
  const { isDialogOpen, dialog, onClose } = useGlobalDialog();
  const navigate = useNavigate();
  const isClosingRef = useRef(false);

  // State for checkboxes
  const [clearResults, setClearResults] = useState(false);
  const [muteDialog, setMuteDialog] = useState(false);

  const sessionData = dialog?.data?.sessionData;

  // Check if there are actual inputs (not just empty object)
  const hasInputs = Boolean(
    sessionData?.inputs?.businessProblem ||
    sessionData?.inputs?.businessSolution ||
    sessionData?.businessProblem ||
    sessionData?.businessSolution,
  );

  // Check if there are actual results - must be a real object with content
  // Not just an empty structure. Results can be in multiple formats.
  const hasResults = Boolean(
    // Direct result objects
    (sessionData?.results &&
      typeof sessionData.results === 'object' &&
      Object.keys(sessionData.results).length > 0) ||
    (sessionData?.calculatedResults &&
      typeof sessionData.calculatedResults === 'object' &&
      Object.keys(sessionData.calculatedResults).length > 0) ||
    (sessionData?.result_json &&
      typeof sessionData.result_json === 'object' &&
      Object.keys(sessionData.result_json).length > 0) ||
    // Check for result-related fields in the sessionData object itself
    (sessionData &&
      typeof sessionData === 'object' &&
      Object.keys(sessionData).some(
        (key) =>
          (key.includes('score') && sessionData[key] !== null && sessionData[key] !== '') ||
          (key.includes('result') && sessionData[key] !== null && sessionData[key] !== '') ||
          (key.includes('audit') && sessionData[key] !== null && sessionData[key] !== ''),
      )),
  );

  // Reset closing flag when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      isClosingRef.current = false;
    }
  }, [isDialogOpen]);

  const handleCancel = useCallback(async () => {
    if (isClosingRef.current) return;

    try {
      // Clear results if checkbox is selected
      if (clearResults) {
        const sessionData = JSON.parse(localStorage.getItem('session_evaluation_state') || '{}');
        if (sessionData.results) {
          delete sessionData.results;
          localStorage.setItem('session_evaluation_state', JSON.stringify(sessionData));
        }
      }

      // Set mute dialog in localStorage if checkbox is selected
      if (muteDialog) {
        localStorage.setItem('results_restore_dialog_muted', 'true');
        // Set expiration for 10 minutes from now
        const expirationTime = Date.now() + 10 * 60 * 1000;
        localStorage.setItem('results_restore_dialog_muted_expiration', expirationTime.toString());
      }

      // Stay on the same page when canceling (no navigation needed)
      isClosingRef.current = true;
      onClose();
    } catch (error) {
      logger.error('Cancel action failed:', error);
      isClosingRef.current = true;
      onClose();
    }
  }, [onClose, navigate, clearResults, muteDialog]);

  const handleRestoreResults = useCallback(async () => {
    if (isClosingRef.current) return;

    try {
      // Set mute dialog in localStorage if checkbox is selected
      if (muteDialog) {
        localStorage.setItem('results_restore_dialog_muted', 'true');
        // Set expiration for 10 minutes from now
        const expirationTime = Date.now() + 10 * 60 * 1000;
        localStorage.setItem('results_restore_dialog_muted_expiration', expirationTime.toString());
      }

      const resultsData = sessionData?.results;
      navigate('/results', {
        state: {
          result: resultsData,
          scoreData: resultsData,
          isRestored: true,
          formData: {
            businessProblem:
              sessionData?.inputs?.businessProblem || sessionData?.businessProblem || '',
            businessSolution:
              sessionData?.inputs?.businessSolution || sessionData?.businessSolution || '',
            evaluationParameters: sessionData?.inputs?.evaluationParameters || {},
            businessContext: sessionData?.inputs?.businessContext || {},
          },
          fromAnonymous: sessionData?.fromAnonymous || false,
        },
      });
      isClosingRef.current = true;
      onClose();
    } catch (error) {
      logger.error('Restore results action failed:', error);
      isClosingRef.current = true;
      onClose();
    }
  }, [sessionData, navigate, onClose, muteDialog]);

  const handleBackdropChange = useCallback(
    (newOpen) => {
      // Prevent reopening if we're in the middle of closing
      if (isClosingRef.current && newOpen) {
        return;
      }

      if (!newOpen) {
        isClosingRef.current = true;
        onClose();
      }
    },
    [onClose],
  );

  if (!hasInputs && !hasResults) return null;
  if (!isDialogOpen) return null;

  const resultsPageUrl = `${window.location.origin}/results`;
  const displayResultsPageUrl = cleanUrl(resultsPageUrl, { stripProtocol: true, stripWww: true });

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={true}
        onOpenChange={handleBackdropChange}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog aria-label="Restore Previous Session">
            <AlertDialog.Header>
              <AlertDialog.Icon
                status="success"
                className="alert-dialog__icon alert-dialog__icon--success"
              >
                <RefreshCw size={20} />
              </AlertDialog.Icon>
              <AlertDialog.Heading>Restore your previous results?</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="text-center text-sm/relaxed text-(--color-text-secondary)">
              Your inputs are automatically saved, but we also found a completed calculation from a
              previous session. Would you like to restore those results now?
              <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-dashed border-(--color-border-ui) p-1 px-2">
                <FileCheck className="size-5 shrink-0 text-(--color-text-muted)" />
                <p className="text-xs font-medium text-black/60">
                  {hasResults ? (
                    <>
                      Completed calculation found from
                      <br />[{formatTimestamp(sessionData?.results?.processing_info?.timestamp)}]
                    </>
                  ) : (
                    'No unsaved results found to restore.'
                  )}
                </p>
              </div>
              {/* Checkboxes section */}
              <div className="mt-4 flex flex-col gap-3">
                <Checkbox
                  id="results_restore_dialog_clear_results"
                  isSelected={clearResults}
                  onChange={setClearResults}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label
                      className="text-xs/3.5 font-normal text-(--color-text-secondary)"
                      htmlFor="results_restore_dialog_clear_results"
                    >
                      Clear calculated results
                    </Label>
                  </Checkbox.Content>
                </Checkbox>

                <div className="relative pb-4.5">
                  <Checkbox
                    id="results_restore_dialog_mute_dialog"
                    isSelected={muteDialog && !clearResults}
                    onChange={setMuteDialog}
                    isDisabled={clearResults}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                      <Label
                        className="text-xs/3.5 font-normal text-(--color-text-secondary)"
                        htmlFor="results_restore_dialog_mute_dialog"
                      >
                        Don&apos;t show this again for 10 minutes - your results will remain
                        accessible via the navigation menu at{' '}
                      </Label>
                    </Checkbox.Content>
                  </Checkbox>
                  <Link
                    className={cn(
                      'absolute top-6.5 left-7 flex items-center whitespace-nowrap',
                      clearResults
                        ? 'pointer-events-none cursor-not-allowed opacity-50'
                        : 'underline',
                    )}
                    to={clearResults ? '#' : resultsPageUrl}
                    onClick={(e) => {
                      // can't visit the results if checked to clear them
                      if (clearResults) {
                        e.preventDefault();
                        return;
                      }
                      handleCancel();
                    }}
                  >
                    <span>{displayResultsPageUrl}</span>
                    <ExternalLink size={10} strokeWidth={2} className="mt-0.5 ml-0.5 inline" />
                  </Link>
                </div>
              </div>
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <div className="flex gap-2">
                <Button variant="ghost" onPress={handleCancel} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="teal"
                  onPress={handleRestoreResults}
                  isDisabled={!hasResults || clearResults}
                  className="flex-1"
                >
                  Restore Results
                </Button>
              </div>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

// Memoized to prevent duplicate renders from DialogManager
const MemoizedContent = React.memo(ResultsRestoreDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
const ResultsRestoreDialog = React.memo(function ResultsRestoreDialog() {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed - this is critical for preventing double-render issues
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="session-restore-dialog" />;
});

// Legacy export for backward compatibility
ResultsRestoreDialog.Content = ResultsRestoreDialogContent;

export default ResultsRestoreDialog;
