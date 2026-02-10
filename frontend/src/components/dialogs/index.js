/**
 * Dialogs - Reusable dialog components
 * Implements HeroUI v3 AlertDialog and Modal patterns
 *
 * Base components:
 * - ConfirmDialog: Legacy yes/no confirmations
 *
 * Specialized AlertDialogs:
 * - DeleteAssessmentDialog: Confirm assessment deletion
 * - ReplaceInputsDialog: Confirm overwriting form inputs
 * - SessionRestoreDialog: Restore previous evaluation session
 *
 * Specialized Modals:
 * - SaveAssessmentDialog: Save assessment with name input
 *
 * Location: src/components/dialogs/index.js
 */

export { ConfirmDialog } from './ConfirmDialog';
export { DeleteAssessmentDialog } from './DeleteAssessmentDialog';
export { RenameAssessmentDialog } from './RenameAssessmentDialog';
export { ReplaceInputsDialog } from './ReplaceInputsDialog';
export { SessionRestoreDialog } from './SessionRestoreDialog';
export { SaveAssessmentDialog } from './SaveAssessmentDialog';
