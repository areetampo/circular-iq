/**
 * Dialog Manager
 * Central renderer for all dialogs in the application
 * Rendered in AppContainer.jsx to ensure dialogs always render at correct z-index
 *
 * Location: src/components/dialogs/DialogManager.jsx
 *
 * This component:
 * 1. Gets the global dialog state via useGlobalDialog()
 * 2. Switches on dialog type
 * 3. Renders the appropriate dialog component
 * 4. Passes data payload to dialog components
 *
 * Each dialog component is responsible for:
 * - Using useGlobalDialog() to get isDialogOpen and onClose
 * - Rendering only if isDialogOpen is true
 * - Managing its own content and interactions
 *
 * @example
 * In AppContainer.jsx:
 * return <DialogManager />;
 * (No props needed - gets dialog state directly from context)
 */

import React from 'react';

import DIALOG_TYPES from '@/constants/dialogTypes';
import { useGlobalDialog } from '@/contexts/DialogContext';

import ConfirmDialog from './ConfirmDialog';
import DeleteAssessmentDialog from './DeleteAssessmentDialog';
import LimitReachedDialog from './LimitReachedDialog';
import RenameAssessmentDialog from './RenameAssessmentDialog';
import ReplaceInputsDialog from './ReplaceInputsDialog';
import ResultsRestoreDialog from './ResultsRestoreDialog';
import SaveAssessmentDialog from './SaveAssessmentDialog';

function DialogManagerContent() {
  // Get dialog state directly from context instead of props
  // This allows React.memo() to work properly without prop reference issues
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
      return <ReplaceInputsDialog />;

    case DIALOG_TYPES.LIMIT_REACHED:
      return <LimitReachedDialog anonScoringLimit={data?.anonScoringLimit} />;

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
      return <ResultsRestoreDialog sessionData={data?.sessionData} onDismiss={data?.onDismiss} />;

    default:
      logger.warn('Unknown dialog type:', type);
      return null;
  }
}

// Memoize the entire manager - now works properly since it gets state from context directly
const DialogManager = React.memo(DialogManagerContent);

DialogManager.propTypes = {};

export default DialogManager;
