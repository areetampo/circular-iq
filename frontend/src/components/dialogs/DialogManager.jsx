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

import {
  ConfirmDialog,
  DeleteAssessmentDialog,
  LimitReachedDialog,
  RenameAssessmentDialog,
  ReplaceInputsDialog,
  SaveAssessmentDialog,
  SessionRestoreDialog,
} from '@/components/dialogs';
import DIALOGS from '@/components/dialogs/dialogTypes';
import { useGlobalDialog } from '@/contexts/DialogContext';

function DialogManagerContent() {
  // Get dialog state directly from context instead of props
  // This allows React.memo() to work properly without prop reference issues
  const { dialog } = useGlobalDialog();

  if (!dialog || !dialog.type) return null;

  const { type, data } = dialog;

  switch (type) {
    case DIALOGS.DELETE_ASSESSMENT:
      return <DeleteAssessmentDialog assessmentName={data?.assessmentName} />;

    case DIALOGS.SAVE_ASSESSMENT:
      return <SaveAssessmentDialog defaultName={data?.defaultName} />;

    case DIALOGS.RENAME_ASSESSMENT:
      return <RenameAssessmentDialog defaultName={data?.defaultName} />;

    case DIALOGS.REPLACE_INPUTS:
      return <ReplaceInputsDialog />;

    case DIALOGS.LIMIT_REACHED:
      return <LimitReachedDialog limit={data?.limit} message={data?.message} />;

    case DIALOGS.CONFIRM:
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

    case DIALOGS.SESSION_RESTORE:
      return <SessionRestoreDialog sessionData={data?.sessionData} onDismiss={data?.onDismiss} />;

    default:
      console.warn('Unknown dialog type:', type);
      return null;
  }
}

// Memoize the entire manager - now works properly since it gets state from context directly
const DialogManager = React.memo(DialogManagerContent);

export default DialogManager;

export { DialogManager };
