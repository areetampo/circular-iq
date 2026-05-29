/**
 * Offers to restore a prior evaluation results snapshot from localStorage.
 * Self-contained: reads session via `loadEvaluationState()` rather than dialog.data.
 * Inputs are always synced separately; only results restoration is offered here.
 */

import { AlertDialog, Checkbox, Label } from '@heroui/react';
import { ExternalLink, FileCheck, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { cleanUrl, formatTimestamp } from '@/lib/formatting';
import { loadEvaluationState } from '@/lib/storage';
import { cn } from '@/utils/cn';

/**
 * Renders restore-result content for a prior scoring snapshot found in localStorage.
 * Reads `session_evaluation_state` directly; supports clearing results or muting for 10 minutes.
 */
function ResultsRestoreDialogContent() {
  const { isDialogOpen, onClose } = useGlobalDialog();
  const navigate = useNavigate();
  const isClosingRef = useRef(false);

  // Checkbox state controls whether cancel clears results or temporarily mutes this prompt.
  const [clearResults, setClearResults] = useState(false);
  const [muteDialog, setMuteDialog] = useState(false);

  // This dialog owns its localStorage read instead of relying on dialog.data.
  // AppSessionManager verifies results before opening; re-reading here keeps the modal current.
  const sessionData = loadEvaluationState();

  // Empty input objects should not trigger a restore prompt on their own.
  const hasInputs = Boolean(
    sessionData?.inputs?.businessProblem ||
    sessionData?.inputs?.businessSolution ||
    sessionData?.businessProblem ||
    sessionData?.businessSolution,
  );

  // Results can be stored in several legacy shapes, but empty containers should not count.
  const hasResults = Boolean(
    // Direct result objects.
    (sessionData?.results &&
      typeof sessionData.results === 'object' &&
      Object.keys(sessionData.results).length > 0) ||
    (sessionData?.calculatedResults &&
      typeof sessionData.calculatedResults === 'object' &&
      Object.keys(sessionData.calculatedResults).length > 0) ||
    (sessionData?.result_json &&
      typeof sessionData.result_json === 'object' &&
      Object.keys(sessionData.result_json).length > 0) ||
    // Legacy sessions may keep result-related fields at the root.
    (sessionData &&
      typeof sessionData === 'object' &&
      Object.keys(sessionData).some(
        (key) =>
          (key.includes('score') && sessionData[key] !== null && sessionData[key] !== '') ||
          (key.includes('result') && sessionData[key] !== null && sessionData[key] !== '') ||
          (key.includes('audit') && sessionData[key] !== null && sessionData[key] !== ''),
      )),
  );

  // A fresh open must allow cancel/restore handlers after the previous close cycle finished.
  useEffect(() => {
    if (isDialogOpen) {
      isClosingRef.current = false;
    }
  }, [isDialogOpen]);

  const handleCancel = useCallback(async () => {
    if (isClosingRef.current) return;

    try {
      // Clearing only removes calculated output; saved inputs remain available on the form.
      if (clearResults) {
        const sessionData = JSON.parse(localStorage.getItem('session_evaluation_state') || '{}');
        if (sessionData.results) {
          delete sessionData.results;
          localStorage.setItem('session_evaluation_state', JSON.stringify(sessionData));
        }
      }

      // Muting is temporary so users are reminded again after the short quiet period.
      if (muteDialog) {
        localStorage.setItem('results_restore_dialog_muted', 'true');
        const expirationTime = Date.now() + 10 * 60 * 1000;
        localStorage.setItem('results_restore_dialog_muted_expiration', expirationTime.toString());
      }
    } catch (error) {
      logger.error('[DIALOG_RESULTS_RESTORE:CANCEL_FAILED]', error);
    } finally {
      isClosingRef.current = true;
      onClose();
    }
  }, [onClose, navigate, clearResults, muteDialog]);

  const handleRestoreResults = useCallback(async () => {
    if (isClosingRef.current) return;

    try {
      // Muting before navigation prevents the prompt from immediately reopening on /results.
      if (muteDialog) {
        localStorage.setItem('results_restore_dialog_muted', 'true');
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
      logger.error('[DIALOG_RESULTS_RESTORE:RESTORE_FAILED]', error);
      isClosingRef.current = true;
      onClose();
    }
  }, [sessionData, navigate, onClose, muteDialog]);

  const handleBackdropChange = useCallback(
    (newOpen) => {
      // HeroUI can emit a transient reopen during close animation; ignore that edge.
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
              {/* Checkboxes control whether cancel clears output or temporarily mutes this prompt. */}
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
                      // Results navigation is disabled when the user chose to clear them.
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

// AlertDialog content is memoized to avoid duplicate render cycles during open/close transitions.
const MemoizedContent = React.memo(ResultsRestoreDialogContent);

/**
 * Shell mounted by DialogManager that renders content only while the restore dialog is open.
 * Returning null when closed avoids double-mount issues with AlertDialog.
 */
const ResultsRestoreDialog = React.memo(function ResultsRestoreDialog() {
  const { isDialogOpen } = useGlobalDialog();

  // Closed dialogs stay unmounted so AlertDialog does not keep stale focus state.
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="session-restore-dialog" />;
});

// Preserve the historical Content export for tests or legacy imports.
ResultsRestoreDialog.Content = ResultsRestoreDialogContent;

export default ResultsRestoreDialog;
