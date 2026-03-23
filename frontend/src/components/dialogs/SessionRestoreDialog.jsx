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
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (!usingProps) onClose();
          // Do not call propOnDismiss here to avoid parent-driven navigation,
          // especially for Cancel close flows. Navigation is handled explicitly
          // in Restore action only.
        }
      }}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status="success">
                  <RefreshCw size={25} />
                </AlertDialog.Icon>
                <AlertDialog.Heading>
                  Restore Previous Session from {formatDate(sessionData?.timestamp)}?
                </AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="space-y-3">
                <p className="text-sm text-gray-600 italic">
                  Your inputs are already saved locally — you can restore calculated results below
                  or continue from your saved inputs.
                </p>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <p className="text-[0.9rem] font-semibold text-blue-900 flex items-center gap-2">
                    <FileCheck size={20} className="inline" />
                    <span>Calculated results</span>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {hasResults
                      ? 'You have unsaved assessment results'
                      : 'No calculated results found to restore.'}
                  </p>
                </div>
              </AlertDialog.Body>

              <AlertDialog.Footer>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    variant="tertiary"
                    onPress={() => {
                      handleCancel();
                      close();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="success"
                    onPress={() => {
                      handleRestoreResults();
                      close();
                    }}
                    isDisabled={!hasResults}
                    className="flex-1"
                  >
                    Restore Results
                  </Button>
                </div>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
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
