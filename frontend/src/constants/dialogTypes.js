/**
 * Dialog Type Constants
 * Defines all available dialog types in the application
 * Used for centralized dialog state management via DialogManager
 *
 * Location: src/constants/dialogTypes.js
 *
 * @example
 * import DIALOG_TYPES from '@/constants/dialogTypes';
 * const { openDeleteAssessmentDialog } = useGlobalDialog();
 * openDeleteAssessmentDialog({ assessmentName: 'My Assessment' });
 */

const DIALOG_TYPES = {
  DELETE_ASSESSMENT: 'delete-assessment',
  SAVE_ASSESSMENT: 'save-assessment',
  RENAME_ASSESSMENT: 'rename-assessment',
  REPLACE_INPUTS: 'replace-inputs',
  CONFIRM: 'confirm',
  SESSION_RESULTS_RESTORE: 'session-results-restore',
  LIMIT_REACHED: 'limit-reached',
};

export default DIALOG_TYPES;
