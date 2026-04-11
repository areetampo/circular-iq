import { toast } from '@heroui/react';
import { CircleX, Download, FolderPen, MoveLeft, RefreshCw, Save } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { Button, CopyButton } from '@/components/common';
import { getSession, saveSession } from '@/utils/session';

export function ResultsActionBar({
  currentData,
  user,
  isPublicShare,
  isViewFromMyAssessments,
  isExporting,
  onReevaluate,
  onDownloadPDF,
  onDownloadCSV,
  onSave,
  onOpenRename,
  onOpenDelete,
  defaultAssessmentName,
  actualResult,
  resolvedFormData,
  sessionSnapshot,
  navigationResult,
  navigate,
  openSaveAssessmentDialog,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
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
          <Button as={Link} to="/assessments" variant="ghost" size="md">
            <MoveLeft size={14} className="mr-1" /> My Assessments
          </Button>
        )}
        {(currentData || actualResult) && (
          <Button variant="ghost" size="md" onPress={onReevaluate}>
            <RefreshCw size={14} className="mr-1" /> Re-evaluate
          </Button>
        )}
      </div>

      {/* Right group - actions, pushed to end */}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="md" onPress={onDownloadPDF} isDisabled={isExporting}>
          <Download size={14} className="mr-1" /> PDF
        </Button>
        <Button variant="ghost" size="md" onPress={onDownloadCSV} isDisabled={isExporting}>
          <Download size={14} className="mr-1" /> CSV
        </Button>
        {!isViewFromMyAssessments && !isPublicShare && (
          <Button
            variant="ghost"
            size="md"
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
                    navigate('/auth', { state: { mode: 'signup', from: '/results' } });
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
            disabled={isExporting}
          >
            <Save size={14} className="mr-1" /> Save
          </Button>
        )}
        {/* If this assessment belongs to the current user, show rename/delete */}
        {isViewFromMyAssessments &&
          currentData &&
          currentData.user_id &&
          user?.id === currentData.user_id && (
            <>
              <Button variant="results-action" onPress={onOpenRename}>
                <FolderPen size={16} />
                Rename
              </Button>
              <Button variant="results-action" onPress={onOpenDelete}>
                <CircleX size={16} />
                Delete
              </Button>
            </>
          )}
        {isPublicShare && currentData?.public_id && (
          <CopyButton
            value={currentData.public_id}
            size={12}
            strokeWidth={2.5}
            description="ID"
            noBorder
            color="#00000077"
          />
        )}
      </div>
    </div>
  );
}

ResultsActionBar.propTypes = {
  currentData: PropTypes.object,
  user: PropTypes.object,
  isPublicShare: PropTypes.bool,
  isViewFromMyAssessments: PropTypes.bool,
  isExporting: PropTypes.bool,
  onReevaluate: PropTypes.func,
  onDownloadPDF: PropTypes.func,
  onDownloadCSV: PropTypes.func,
  onSave: PropTypes.func,
  onOpenRename: PropTypes.func,
  onOpenDelete: PropTypes.func,
  defaultAssessmentName: PropTypes.string,
  actualResult: PropTypes.object,
  resolvedFormData: PropTypes.object,
  sessionSnapshot: PropTypes.object,
  navigationResult: PropTypes.object,
  navigate: PropTypes.func,
  openSaveAssessmentDialog: PropTypes.func,
};
