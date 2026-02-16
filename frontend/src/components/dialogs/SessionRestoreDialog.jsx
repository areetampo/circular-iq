/**
 * Session Restore Dialog
 * Specialized AlertDialog for restoring previous evaluation sessions
 * Follows HeroUI v3 AlertDialog pattern with accent status
 *
 * Now uses centralized dialog state via useGlobalDialog()
 *
 * Location: src/components/dialogs/SessionRestoreDialog.jsx
 *
 * @example
 * In a component using useGlobalDialog hook:
 * const { openSessionRestoreDialog } = useGlobalDialog();
 * openSessionRestoreDialog({
 *   onRestore: handleRestore,
 *   onDismiss: handleDismiss,
 * });
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertDialog } from '@heroui/react';
import { Button } from '@/components/common';
import { RotateCcw } from 'lucide-react';
import { useGlobalDialog } from '@/contexts/DialogContext';

/**
 * Dialog for restoring previous evaluation sessions
 *
 * Gets callbacks from centralized dialog state
 */
export function SessionRestoreDialog(props) {
  // Props take precedence (used by LandingPage SessionRestorePrompt)
  const {
    isOpen: propIsOpen,
    onRestore: propOnRestore,
    onDismiss: propOnDismiss,
    sessionData: propSessionData,
  } = props || {};
  const { isDialogOpen, onClose, dialog } = useGlobalDialog();

  const usingProps = typeof propIsOpen !== 'undefined' || propOnRestore || propOnDismiss;

  const isOpen = usingProps ? Boolean(propIsOpen) : isDialogOpen;
  const onRestore = usingProps ? propOnRestore : dialog?.data?.onRestore;
  const onDismiss = usingProps ? propOnDismiss : dialog?.data?.onDismiss;
  const placement = usingProps ? 'center' : dialog?.data?.placement || 'center';
  const size = usingProps ? 'sm' : dialog?.data?.size || 'sm';

  const handleDismiss = () => {
    onDismiss?.();
    if (!usingProps) onClose();
  };

  const handleRestore = () => {
    onRestore?.(propSessionData);
    if (!usingProps) onClose();
  };

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !usingProps) onClose();
      }}
      variant="opaque"
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <AlertDialog.Container placement={placement} size={size}>
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Icon status="accent">
                  <RotateCcw />
                </AlertDialog.Icon>
                <AlertDialog.Heading>Restore Previous Session</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>
                  We found your previous evaluation session with all your inputs saved. Would you
                  like to continue where you left off?
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  variant="tertiary"
                  onPress={() => {
                    handleDismiss();
                    close();
                  }}
                >
                  Start Fresh
                </Button>
                <Button
                  variant="success"
                  onPress={() => {
                    handleRestore();
                    close();
                  }}
                >
                  Restore Session
                </Button>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

SessionRestoreDialog.propTypes = {};
