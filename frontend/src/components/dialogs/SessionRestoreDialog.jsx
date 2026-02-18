import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { AlertDialog } from '@heroui/react';
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
    navigate('/');
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
          parameters: sessionData?.inputs?.parameters || sessionData?.parameters || {},
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
          propOnDismiss?.();
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
                <AlertDialog.Heading>Restore Previous Session?</AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body>
                <p className="text-gray-700 mb-3">
                  We found a previous session from {formatDate(sessionData?.timestamp)}
                </p>

                <div className="space-y-2 mb-4">
                  {hasInputs && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-sm font-medium text-amber-900">📝 Saved inputs</p>
                      <p className="text-sm text-amber-700 mt-1">
                        You started filling out the assessment form
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm font-medium text-blue-900">📊 Calculated results</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {hasResults
                        ? 'You have unsaved assessment results'
                        : 'No calculated results found to restore.'}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Your inputs are already saved locally — you can restore calculated results below
                  or continue from your saved inputs.
                </p>
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
