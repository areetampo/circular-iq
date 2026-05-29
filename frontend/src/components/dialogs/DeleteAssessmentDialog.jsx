/** Permanent-delete confirmation for saved assessments opened via `openDeleteAssessmentDialog`. */

import { AlertDialog } from '@heroui/react';
import { Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Renders destructive delete content and invokes `dialog.data.onConfirm` after confirmation.
 */
function DeleteAssessmentDialogContent({ assessmentName = '' }) {
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  // Memoize dialog callbacks so the alert content does not re-render from data object churn.
  const onConfirm = useMemo(() => dialog?.data?.onConfirm, [dialog?.data?.onConfirm]);
  const isLoading = useMemo(() => dialog?.data?.isLoading || false, [dialog?.data?.isLoading]);

  const handleOpenChange = useCallback(
    (isOpen) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isDialogOpen) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={true}
        onOpenChange={handleOpenChange}
        variant="opaque"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog>
            {({ close }) => (
              <>
                <AlertDialog.Header className="flex items-center justify-center">
                  <AlertDialog.Icon
                    status="danger"
                    className="alert-dialog__icon alert-dialog__icon--danger"
                  >
                    <Trash2 size={20} />
                  </AlertDialog.Icon>
                  <AlertDialog.Heading className="pr-2">Delete Assessment?</AlertDialog.Heading>
                </AlertDialog.Header>

                <AlertDialog.Body className="flex flex-col items-center justify-center">
                  <span>This will permanently delete assessment</span>
                  <span className="font-medium">{assessmentName}</span>
                  <span>This action cannot be undone.</span>
                </AlertDialog.Body>

                <AlertDialog.Footer>
                  <Button variant="ghost" className="flex-1" onPress={close}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onPress={() => {
                      if (onConfirm) onConfirm();
                      close();
                    }}
                    isDisabled={isLoading}
                  >
                    Delete
                  </Button>
                </AlertDialog.Footer>
              </>
            )}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

DeleteAssessmentDialogContent.propTypes = {
  assessmentName: PropTypes.string,
};

// AlertDialog content is memoized to avoid duplicate render cycles during open/close transitions.
const MemoizedContent = React.memo(DeleteAssessmentDialogContent);

/**
 * Mounts memoized delete confirmation content only while the delete dialog is open.
 */
const DeleteAssessmentDialog = React.memo(function DeleteAssessmentDialog({ assessmentName = '' }) {
  const { isDialogOpen } = useGlobalDialog();

  // Closed dialogs stay unmounted so AlertDialog does not keep stale focus state.
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="delete-assessment-dialog" assessmentName={assessmentName} />;
});

DeleteAssessmentDialog.propTypes = {
  assessmentName: PropTypes.string,
};

export default DeleteAssessmentDialog;
