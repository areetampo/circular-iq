import React from 'react';
import PropTypes from 'prop-types';
import { RotateCcw } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

/**
 * SessionRestorePrompt component
 *
 * Usage with useSession hook:
 * ```jsx
 * const { hasEvaluationState, restoreEvaluation, clearEvaluation } = useSession();
 *
 * {hasEvaluationState && (
 *   <SessionRestorePrompt
 *     onRestore={() => {
 *       const state = restoreEvaluation();
 *       // Apply state to form...
 *     }}
 *     onDismiss={() => clearEvaluation()}
 *   />
 * )}
 * ```
 */
export default function SessionRestorePrompt({ isOpen = true, onRestore, onDismiss }) {
  return (
    <Modal
      isOpen={isOpen}
      size="sm"
      backdrop="opaque"
      placement="center"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={true}
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 py-4 px-6">
              <RotateCcw className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Restore Previous Session</h2>
            </ModalHeader>
            <ModalBody className="py-6 px-6">
              <p className="mb-4 leading-relaxed text-gray-700">
                We found your previous evaluation session with all your inputs saved. Would you like
                to continue where you left off?
              </p>
              <div className="space-y-3 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Restore Session</p>
                  <p className="text-xs text-gray-600">
                    Reload your saved problem description, solution, and parameter settings. You can
                    continue editing from where you left off.
                  </p>
                </div>
                <div className="border-t border-blue-200 pt-3">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Start Fresh</p>
                  <p className="text-xs text-gray-600">
                    Begin a new evaluation with a blank form. Your previous session will be cleared.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="gap-3 py-4 px-6">
              <Button variant="light" onPress={onDismiss}>
                Start Fresh
              </Button>
              <Button onPress={onRestore} color="success" className="font-medium">
                Restore Session
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

SessionRestorePrompt.propTypes = {
  isOpen: PropTypes.bool,
  onRestore: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
