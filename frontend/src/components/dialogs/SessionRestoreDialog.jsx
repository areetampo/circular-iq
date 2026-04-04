import { AlertDialog } from '@heroui/react';
import { FileCheck, RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

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
export function SessionRestoreDialog(props) {
  const {
    isOpen: propIsOpen,
    onDismiss: propOnDismiss,
    sessionData: propSessionData,
  } = props || {};

  const { isDialogOpen, dialog, onClose } = useGlobalDialog();
  const navigate = useNavigate();

  const usingProps = typeof propIsOpen !== 'undefined';
  const isOpen = usingProps ? Boolean(propIsOpen) : isDialogOpen;
  const sessionData = usingProps ? propSessionData : dialog?.data?.sessionData;

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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'recently';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleCancel = () => {
    if (!usingProps) onClose();
    // Stay on the same page when canceling
    navigate(location.pathname);
  };

  const handleRestoreResults = () => {
    if (!usingProps) onClose();
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
  };

  if (!hasInputs && !hasResults) return null;

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!usingProps) onClose();
          }
        }}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog>
            {({ close }) => (
              <>
                <AlertDialog.Header>
                  <AlertDialog.Icon
                    status="success"
                    className="alert-dialog__icon alert-dialog__icon--success"
                  >
                    <RefreshCw size={20} />
                  </AlertDialog.Icon>
                  <AlertDialog.Heading>
                    Restore Previous Session from {formatDate(sessionData?.timestamp)}?
                  </AlertDialog.Heading>
                </AlertDialog.Header>

                <div className="border-t border-[rgba(180,160,130,0.15)] my-4"></div>

                <AlertDialog.Body className="text-sm text-(--color-text-secondary) text-center leading-relaxed">
                  Your inputs are already saved locally — you can restore calculated results below
                  or continue from your saved inputs.
                  <div className="border-2 border-[rgba(180,160,130,0.18)] rounded-md p-1 px-2 flex items-center gap-3 mt-4">
                    <FileCheck className="text-(--color-text-muted) w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-(--color-text-primary)">
                        Calculated results
                      </p>
                      <p className="text-xs text-(--color-text-muted) mt-0.5">
                        {hasResults
                          ? 'You have unsaved assessment results'
                          : 'No calculated results found to restore.'}
                      </p>
                    </div>
                  </div>
                </AlertDialog.Body>

                <AlertDialog.Footer>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      handleCancel();
                      close();
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="teal"
                    onPress={() => {
                      handleRestoreResults();
                      close();
                    }}
                    isDisabled={!hasResults}
                  >
                    Restore Results
                  </Button>
                </AlertDialog.Footer>
              </>
            )}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

SessionRestoreDialog.propTypes = {
  isOpen: PropTypes.bool,
  onDismiss: PropTypes.func,
  sessionData: PropTypes.shape({
    inputs: PropTypes.object,
    results: PropTypes.object,
    calculatedResults: PropTypes.object,
    timestamp: PropTypes.string,
    fromAnonymous: PropTypes.bool,
  }),
};

export default SessionRestoreDialog;
