import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AlertDialog } from '@heroui/react';
import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { Check, TriangleAlert, Infinity } from 'lucide-react';

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
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog>
          {({ close }) => (
            <>
              <AlertDialog.Header>
                <AlertDialog.Heading className="flex items-center gap-2">
                  <TriangleAlert className="size-6 text-yellow-600 inline-block" />
                  <span>Free Trial Limit Reached</span>
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-yellow-600 mb-4 italic">
                  {message || (
                    <>
                      You&apos;ve used your <span className="font-bold">{limit}</span> free
                      evaluations. Create an account to continue assessing your circular economy
                      initiatives!
                    </>
                  )}
                </p>
                <p className="text-gray-600">Create a free account to get:</p>
                <ul className="mt-2 space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <Check className="size-5 text-green-600 mr-2 inline-block" />
                    <span>Unlimited evaluations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="size-5 text-green-600 mr-2 inline-block" />
                    <span>Share assessments</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="size-5 text-green-600 mr-2 inline-block" />
                    <span>Save and compare results</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="size-5 text-green-600 mr-2 inline-block" />
                    <span>Access dashboard analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="size-5 text-green-600 mr-2 inline-block" />
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
                  Sign Up
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
