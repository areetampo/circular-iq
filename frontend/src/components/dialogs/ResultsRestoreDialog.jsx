import { AlertDialog } from '@heroui/react';
import { FileCheck, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { formatTimestamp } from '@/lib/formatting';

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
      // Stay on the same page when canceling
      navigate(location.pathname);
      isClosingRef.current = true;
      onClose();
    } catch (error) {
      console.error('Cancel action failed:', error);
      isClosingRef.current = true;
      onClose();
    }
  }, [onClose, navigate]);

  const handleRestoreResults = useCallback(async () => {
    if (isClosingRef.current) return;

    try {
      const resultsData =
        sessionData?.results || sessionData?.calculatedResults || sessionData?.result_json;
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
      console.error('Restore results action failed:', error);
      isClosingRef.current = true;
      onClose();
    }
  }, [sessionData, navigate, onClose]);

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
              <AlertDialog.Heading>Restore previously calculated results?</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="text-center text-sm/relaxed text-(--color-text-secondary)">
              Your inputs are already saved locally — you can restore calculated results below or
              continue from your saved inputs.
              <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-dashed border-[rgba(180,160,130,0.3)] p-1 px-2">
                <FileCheck className="size-5 shrink-0 text-(--color-text-muted)" />
                <p className="text-xs font-medium text-black/60">
                  {hasResults ? (
                    <>
                      You have unsaved calculated results from
                      <br />
                      {formatTimestamp(sessionData?.results?.processing_info?.timestamp)}
                    </>
                  ) : (
                    'No calculated results found to restore.'
                  )}
                </p>
              </div>
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button variant="ghost" onPress={handleCancel} className="flex-1">
                Cancel
              </Button>

              <Button
                variant="teal"
                onPress={handleRestoreResults}
                isDisabled={!hasResults}
                className="flex-1"
              >
                Restore Results
              </Button>
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
export const ResultsRestoreDialog = React.memo(function ResultsRestoreDialog() {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed - this is critical for preventing double-render issues
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="session-restore-dialog" />;
});

ResultsRestoreDialog.propTypes = {
  // Props are no longer used - dialog gets data from useGlobalDialog
};

// Legacy export for backward compatibility
ResultsRestoreDialog.Content = ResultsRestoreDialogContent;

export default ResultsRestoreDialog;
