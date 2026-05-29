/**
 * Sticky action bar: export, save, rename, delete, re-evaluate, and navigation on Results.
 */

import { toast } from '@heroui/react';
import { CircleX, Download, Eye, FolderPen, MoveLeft, RefreshCw, Save } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button, CopyButton } from '@/components/common';
import { useAssessmentHandlers } from '@/features/export';
import { getSession, saveSession } from '@/utils/session';

/**
 * Sticky bar: export, save, rename, delete, re-evaluate, and back navigation.
 * Hides save/rename/delete when `isPublicShare`; adjusts copy when `isViewFromMyAssessments`.
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
  const navigate = useNavigate();

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
    <div {...props} className="mb-2 flex flex-col justify-center gap-1">
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
                    } catch (error) {
                      logger.warn('[RESULTS_ACTION_BAR:PENDING_SAVE_SESSION_FAILED]', error);
                    }

                    toast.info('Sign in to save your results', {
                      description: 'You will be returned to your results after signing in',
                      duration: 4000,
                    });
                    sessionStorage.setItem('pendingSaveAfterLogin', 'true');
                    logger.log(
                      '[RESULTS_ACTION_BAR:PENDING_SAVE_SESSION_SET]',
                      'set pendingSaveAfterLogin, value now:',
                      sessionStorage.getItem('pendingSaveAfterLogin'),
                    );
                    navigate('/auth', { state: { from: '/results' } });

                    return;
                  } catch (error) {
                    logger.error('[RESULTS_ACTION_BAR:PENDING_SAVE_PREPARE_FAILED]', error);
                    toast.error('Failed to prepare save. Please try again.');
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
