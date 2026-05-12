import { toast } from '@heroui/react';
import { CircleX, Download, Eye, FolderPen, MoveLeft, RefreshCw, Save } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

import { Button, CopyButton } from '@/components/common';
import { useAssessmentHandlers } from '@/features/export';
import { getSession, saveSession } from '@/utils/session';

/**
 * ResultsActionBar - Action bar component for results page
 * Provides download, save, rename, delete, and navigation functionality
 *
 * @param {Object} props - Component props
 * @param {Object} props.currentData - Current assessment data object
 * @param {Object} props.user - User object with authentication info
 * @param {boolean} [props.isPublicShare=false] - Whether this is a public share view
 * @param {boolean} [props.isViewFromMyAssessments=false] - Whether this is viewed from My Assessments page
 * @param {Function} props.onSave - Callback for save action
 * @param {Function} props.onOpenRename - Callback for rename dialog
 * @param {Function} props.onOpenDelete - Callback for delete dialog
 * @param {string} [props.defaultAssessmentName] - Default name for new assessments
 * @param {Object} props.actualResult - Actual assessment result data
 * @param {Object} props.resolvedFormData - Form data for resolved assessment
 * @param {Object} props.sessionSnapshot - Session snapshot data
 * @param {Object} props.navigationResult - Navigation result data
 * @param {Function} props.openSaveAssessmentDialog - Callback to open save dialog
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered ResultsActionBar
 *
 * @example
 * Basic usage
 * <ResultsActionBar currentData={assessment} user={currentUser} onSave={handleSave} />
 *
 * @example
 * Public share view
 * <ResultsActionBar currentData={assessment} user={currentUser} isPublicShare={true} />
 */
export default function ResultsActionBar({
  currentData,
  user,
  isPublicShare = false,
  isViewFromMyAssessments = false,
  onSave,
  onOpenRename,
  onOpenDelete,
  defaultAssessmentName,
  actualResult,
  resolvedFormData,
  sessionSnapshot,
  navigationResult,
  openSaveAssessmentDialog,
  ...props
}) {
  const location = useLocation();

  // Create internal handlers using centralized assessment handlers
  const {
    handleDownloadPDFWithErrorHandling,
    handleDownloadCSVWithErrorHandling,
    handleReevaluate: handleReevaluateInternal,
    isExporting,
    isExportingPDF,
    isExportingCSV,
  } = useAssessmentHandlers();

  // Handle re-evaluate using centralized handler with appropriate assessment data
  const handleReevaluateClick = () => {
    // Use currentData for ResultsPage (contains assessment data)
    // For AssessmentColumn usage, currentData will be the assessment
    if (currentData) {
      handleReevaluateInternal(currentData);
    }
  };

  // Handle downloads using internal logic
  const handlePDFDownload = () => {
    if (currentData && actualResult) {
      handleDownloadPDFWithErrorHandling(currentData, actualResult);
    }
  };

  const handleCSVDownload = () => {
    if (currentData && actualResult) {
      handleDownloadCSVWithErrorHandling(currentData, actualResult);
    }
  };

  return (
    <div className="mb-2 flex flex-col justify-center gap-1" {...props}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left group - navigation */}
        <div className="flex items-center gap-3">
          {/* Show public share notice for public viewers */}
          {/* {isPublicShare && (
          <Chip variant="access-type" color="public">
            <div className="flex items-center gap-1">
              <Globe size={14} className="inline" />
              <span>Public Assessment</span>
            </div>
          </Chip>
        )} */}

          {!isPublicShare && (
            <Button as={Link} icon={MoveLeft} iconSize={14} to="/assessments" variant="ghost">
              My Assessments
            </Button>
          )}
          {(currentData || actualResult) && (
            <Button variant="ghost" icon={RefreshCw} iconSize={14} onPress={handleReevaluateClick}>
              Re-evaluate
            </Button>
          )}
          {location.pathname.startsWith('/assessments/share/') && (
            <Button variant="ghost" icon={Eye} iconSize={14} as={Link} to="/assessments/share">
              View another
            </Button>
          )}
        </div>

        {/* Right group - actions, pushed to end */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            icon={Download}
            iconSize={14}
            onPress={handlePDFDownload}
            isDisabled={isExportingPDF}
            isLoading={isExportingPDF}
          >
            PDF
          </Button>
          <Button
            variant="ghost"
            icon={Download}
            iconSize={14}
            onPress={handleCSVDownload}
            isDisabled={isExportingCSV}
            isLoading={isExportingCSV}
          >
            CSV
          </Button>

          {!isViewFromMyAssessments && !isPublicShare && (
            <Button
              variant="ghost"
              icon={Save}
              iconSize={14}
              onPress={() => {
                if (!user) {
                  // Anonymous user: ensure the current result is persisted in session
                  // (results and inputs are independent), then redirect to auth so the
                  // user can sign in and be returned to /results to confirm save.
                  try {
                    const formState = resolvedFormData || sessionSnapshot || getSession() || {};
                    const formInputs = formState?.inputs ? formState.inputs : formState;

                    const pendingResults =
                      (navigationResult && (navigationResult.result || navigationResult)) ||
                      sessionSnapshot?.results ||
                      getSession()?.results ||
                      null;

                    // Persist snapshot to session storage (do NOT set isResultUnsaved flag)
                    try {
                      saveSession({
                        inputs: {
                          businessProblem: formInputs?.businessProblem || '',
                          businessSolution: formInputs?.businessSolution || '',
                          evaluationParameters: formInputs?.evaluation_parameters || {},
                          businessContext: formInputs?.businessContext || {},
                        },
                        results: pendingResults,
                      });
                    } catch (e) {
                      logger.warn('Failed to persist session for pending save:', e);
                    }

                    toast.info('Redirecting to sign in', {
                      description: 'You will be returned to your evaluation after signing in',
                      duration: 5000,
                    });

                    setTimeout(() => {
                      window.location.href = '/auth';
                      // Store redirect state in sessionStorage for auth page to handle
                      sessionStorage.setItem(
                        'authRedirectState',
                        JSON.stringify({ mode: 'signup', from: '/results' }),
                      );
                    }, 500);

                    return;
                  } catch (e) {
                    logger.error('Failed to prepare pending save', e);
                    toast.error('Failed to prepare save');
                    return;
                  }
                }

                openSaveAssessmentDialog({
                  defaultName: defaultAssessmentName,
                  onSave: onSave,
                  scoringResult: actualResult,
                });
              }}
              isDisabled={isExporting}
              isLoading={isExporting}
            >
              Save
            </Button>
          )}

          {/* If this assessment belongs to the current user, show rename/delete */}
          {isViewFromMyAssessments &&
            currentData &&
            currentData.user_id &&
            user?.id === currentData.user_id && (
              <>
                <Button variant="bordered" icon={FolderPen} onPress={onOpenRename}>
                  Rename
                </Button>
                <Button variant="bordered" icon={CircleX} onPress={onOpenDelete}>
                  Delete
                </Button>
              </>
            )}
        </div>
      </div>

      {isPublicShare && currentData?.public_id && (
        <div className="flex items-center justify-end">
          <CopyButton
            variant="dim"
            size="xs"
            copyValue={currentData.public_id}
            title="ID"
            noBorder
          />
          <CopyButton
            variant="dim"
            size="xs"
            copyValue={window.location.href}
            title="URL"
            noBorder
          />
        </div>
      )}
    </div>
  );
}

ResultsActionBar.propTypes = {
  currentData: PropTypes.object,
  user: PropTypes.object,
  isPublicShare: PropTypes.bool,
  isViewFromMyAssessments: PropTypes.bool,
  onSave: PropTypes.func,
  onOpenRename: PropTypes.func,
  onOpenDelete: PropTypes.func,
  defaultAssessmentName: PropTypes.string,
  actualResult: PropTypes.object,
  resolvedFormData: PropTypes.object,
  sessionSnapshot: PropTypes.object,
  navigationResult: PropTypes.object,
  openSaveAssessmentDialog: PropTypes.func,
};
