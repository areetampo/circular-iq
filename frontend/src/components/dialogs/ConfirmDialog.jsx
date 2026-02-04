/**
 * Reusable Confirmation Dialog
 * Base component for yes/no confirmations using HeroUI Modal
 *
 * Location: src/components/dialogs/ConfirmDialog.jsx
 */

import React from 'react';
import PropTypes from 'prop-types';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

/**
 * Reusable confirmation dialog
 *
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Assessment?"
 *   description="This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   onConfirm={handleDelete}
 *   variant="destructive"
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default', // 'default' | 'destructive'
}) {
  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      size="sm"
      backdrop="opaque"
      placement="center"
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 py-4 px-6">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </ModalHeader>
            <ModalBody className="py-6 px-6">
              {description && <p className="text-gray-700 leading-relaxed">{description}</p>}
            </ModalBody>
            <ModalFooter className="gap-3 py-4 px-6">
              <Button variant="light" onPress={onClose}>
                {cancelText}
              </Button>
              <Button
                onPress={() => {
                  onConfirm?.();
                  onClose();
                }}
                color={variant === 'destructive' ? 'danger' : 'primary'}
                className="font-medium"
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'destructive']),
};
