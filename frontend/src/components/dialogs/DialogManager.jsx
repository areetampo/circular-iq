/**
 * Dialog manager that renders the active modal from global dialog state.
 * It switches on `dialog.type` and passes `dialog.data` to the matching dialog component.
 */

import React from 'react';

import { DIALOG_TYPES } from '@/constants';
import { useGlobalDialog } from '@/contexts/DialogContext';

import ConfirmDialog from './ConfirmDialog';
import DeleteAssessmentDialog from './DeleteAssessmentDialog';
import LimitReachedDialog from './LimitReachedDialog';
import RenameAssessmentDialog from './RenameAssessmentDialog';
import ReplaceInputsDialog from './ReplaceInputsDialog';
import ResultsRestoreDialog from './ResultsRestoreDialog';
import SaveAssessmentDialog from './SaveAssessmentDialog';

/**
 * Selects the active dialog component from global dialog context.
 */
function DialogManagerContent() {
  // Reading context inside the memoized component avoids prop reference churn from DialogManager.
  const { dialog } = useGlobalDialog();

  if (!dialog || !dialog.type) return null;

  const { type, data } = dialog;

  switch (type) {
    case DIALOG_TYPES.DELETE_ASSESSMENT:
      return <DeleteAssessmentDialog assessmentName={data?.assessmentName} />;

    case DIALOG_TYPES.SAVE_ASSESSMENT:
      return (
        <SaveAssessmentDialog defaultName={data?.defaultName} scoringResult={data?.scoringResult} />
      );

    case DIALOG_TYPES.RENAME_ASSESSMENT:
      return <RenameAssessmentDialog defaultName={data?.defaultName} />;

    case DIALOG_TYPES.REPLACE_INPUTS:
      return (
        <ReplaceInputsDialog
          title={data?.title}
          description={data?.description}
          confirmText={data?.confirmText}
          cancelText={data?.cancelText}
          onConfirm={data?.onConfirm}
          onCancel={data?.onCancel}
        />
      );

    case DIALOG_TYPES.LIMIT_REACHED:
      return (
        <LimitReachedDialog
          lastUsedAt={data?.lastUsedAt}
          anonScoringLimit={data?.anonScoringLimit}
          anonScoringUsageRetentionDays={data?.anonScoringUsageRetentionDays}
        />
      );

    case DIALOG_TYPES.CONFIRM:
      return (
        <ConfirmDialog
          title={data?.title}
          description={data?.description}
          confirmText={data?.confirmText}
          cancelText={data?.cancelText}
          onConfirm={data?.onConfirm}
          variant={data?.variant}
          isLoading={data?.isLoading}
        />
      );

    case DIALOG_TYPES.SESSION_RESULTS_RESTORE:
      return <ResultsRestoreDialog />;

    default:
      logger.warn('[DIALOG_MANAGER:UNKNOWN_TYPE]', type);
      return null;
  }
}

// Memoize the manager while letting context updates drive active dialog changes.
const DialogManager = React.memo(DialogManagerContent);

DialogManager.propTypes = {};

export default DialogManager;
