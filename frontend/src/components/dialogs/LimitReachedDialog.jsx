import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AlertDialog } from '@heroui/react';
import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';

export function LimitReachedDialog(props) {
  const { limit: propLimit, message: propMessage, isOpen: propIsOpen } = props || {};
  const { isDialogOpen, dialog, onClose } = useGlobalDialog();
  const navigate = useNavigate();

  const usingProps = typeof propIsOpen !== 'undefined' || propLimit || propMessage;
  const isOpen = usingProps ? Boolean(propIsOpen ?? true) : isDialogOpen;

  const limit = usingProps ? propLimit : dialog?.data?.limit;
  const message = usingProps ? propMessage : dialog?.data?.message;

  const handleSignUp = () => {
    onClose();
    navigate('/auth', { state: { mode: 'signup', from: '/' } });
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="opaque"
      isDismissable={true}
    >
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Heading>Free Trial Limit Reached</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-gray-700 mb-4">
                  {message || `You've used your ${limit} free assessments.`}
                </p>
                <p className="text-gray-600">Create a free account to get:</p>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Unlimited assessments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Save and compare results</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Access dashboard analytics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Export reports (PDF, CSV)</span>
                  </li>
                </ul>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  variant="tertiary"
                  onPress={() => {
                    handleCancel();
                    close();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onPress={() => {
                    handleSignUp();
                    close();
                  }}
                >
                  Sign Up Free
                </Button>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

LimitReachedDialog.propTypes = {
  limit: PropTypes.number,
  message: PropTypes.string,
  isOpen: PropTypes.bool,
};
