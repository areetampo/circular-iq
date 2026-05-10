/**
 * Delete Assessment Dialog
 * Specialized dialog for confirming assessment deletion
 * Uses compact dialog pattern with AlertDialog
 *
 * Location: src/components/dialogs/DeleteAssessmentDialog.jsx
 */

import { AlertDialog } from '@heroui/react';
import { Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Specialized dialog for confirming assessment deletion
 * Uses compact dialog pattern
 */
function DeleteAssessmentDialogContent({ assessmentName = '' }) {
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  // Get callback from dialog data with stable references
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
        className=""
      >
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog>
            {({ close }) => (
              <>
                <AlertDialog.Header>
                  <AlertDialog.Icon
                    status="danger"
                    className="alert-dialog__icon alert-dialog__icon--danger"
                  >
                    <Trash2 size={20} />
                  </AlertDialog.Icon>
                  <AlertDialog.Heading>Delete Assessment?</AlertDialog.Heading>
                </AlertDialog.Header>

                <AlertDialog.Body>
                  This will permanently delete assessment{' '}
                  <span>&ldquo;{assessmentName}&rdquo;</span>. This action cannot be undone.
                </AlertDialog.Body>

                <AlertDialog.Footer>
                  <Button variant="ghost" className="flex-1" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      if (onConfirm) onConfirm();
                      close();
                    }}
                    disabled={isLoading}
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

// Memoized content to prevent duplicate renders
const MemoizedContent = React.memo(DeleteAssessmentDialogContent);

// Memoized wrapper - only renders content when dialog is actually open
const DeleteAssessmentDialog = React.memo(function DeleteAssessmentDialog({ assessmentName = '' }) {
  const { isDialogOpen } = useGlobalDialog();

  // Return null when closed to prevent dialog from mounting
  if (!isDialogOpen) {
    return null;
  }

  return <MemoizedContent key="delete-assessment-dialog" assessmentName={assessmentName} />;
});

DeleteAssessmentDialog.propTypes = {
  assessmentName: PropTypes.string,
};

export default DeleteAssessmentDialog;
