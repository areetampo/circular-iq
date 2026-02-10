/**
 * Replace Inputs Dialog
 * Specialized confirmation dialog for replacing form inputs
 * Uses success status to indicate positive action
 *
 * Location: src/components/dialogs/ReplaceInputsDialog.jsx
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertDialog } from '@heroui/react';
import { Button } from '@/components/common';
import { AlertCircle } from 'lucide-react';

/**
 * Dialog for confirming overwriting current form inputs
 *
 * @example
 * <ReplaceInputsDialog
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Replace current inputs?"
 *   description="Loading a test case will overwrite your current business problem and solution."
 *   onConfirm={handleReplace}
 *   confirmText="Replace"
 * />
 */
export function ReplaceInputsDialog({
  isOpen,
  onOpenChange,
  title = 'Replace current inputs?',
  description = 'Loading a test case will overwrite your current inputs.',
  confirmText = 'Replace',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="opaque"
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status="success">
                  <AlertCircle />
                </AlertDialog.Icon>
                <AlertDialog.Heading>{title}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>{description}</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  variant="tertiary"
                  onPress={() => {
                    onCancel?.();
                    close();
                  }}
                >
                  {cancelText}
                </Button>
                <Button
                  variant="success"
                  onPress={() => {
                    onConfirm?.();
                    close();
                  }}
                >
                  {confirmText}
                </Button>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

ReplaceInputsDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};
