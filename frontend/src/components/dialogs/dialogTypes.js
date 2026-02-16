/**
 * Dialog Type Constants
 * Defines all available dialog types in the application
 * Used for centralized dialog state management via DialogManager
 *
 * Location: src/components/dialogs/dialogTypes.js
 *
 * @example
 * import { DIALOGS } from '@/components/dialogs/dialogTypes';
 * const { openDeleteAssessmentDialog } = useGlobalDialog();
 * openDeleteAssessmentDialog({ assessmentName: 'My Assessment' });
 */

export const DIALOGS = {
  DELETE_ASSESSMENT: 'delete-assessment',
  SAVE_ASSESSMENT: 'save-assessment',
  RENAME_ASSESSMENT: 'rename-assessment',
  REPLACE_INPUTS: 'replace-inputs',
  CONFIRM: 'confirm',
  SESSION_RESTORE: 'session-restore',
};

export default DIALOGS;
