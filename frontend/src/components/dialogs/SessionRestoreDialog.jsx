/**
 * Session Restore Dialog
 * Specialized AlertDialog for restoring previous evaluation sessions
 * Follows HeroUI v3 AlertDialog pattern with accent status
 *
 * Location: src/components/dialogs/SessionRestoreDialog.jsx
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertDialog } from '@heroui/react';
import { Button } from '@/components/common';
import { RotateCcw } from 'lucide-react';

/**
 * Dialog for restoring previous evaluation sessions
 *
 * @example
 * <SessionRestoreDialog
 *   isOpen={hasSession}
 *   onRestore={handleRestore}
 *   onDismiss={handleDismiss}
 * />
 */
export function SessionRestoreDialog({
  isOpen,
  onRestore,
  onDismiss,
  placement = 'center',
  size = 'sm',
}) {
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
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
                    onDismiss?.();
                    close();
                  }}
                >
                  Start Fresh
                </Button>
                <Button
                  variant="success"
                  onPress={() => {
                    onRestore?.();
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

SessionRestoreDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRestore: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  placement: PropTypes.oneOf(['auto', 'center', 'top', 'bottom']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'cover']),
};
