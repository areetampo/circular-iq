import { AlertDialog } from '@heroui/react';
import { Angry, FileDown, InfinityIcon, Orbit, Save, Share } from 'lucide-react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

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

  const LIMIT_REACHED_DIALOG_POINTS = [
    { icon: InfinityIcon, text: 'Unlimited evaluations' },
    { icon: Share, text: 'Share assessments' },
    { icon: Save, text: 'Save and compare results' },
    { icon: Orbit, text: 'Access dashboard analytics' },
    { icon: FileDown, text: 'Export reports (PDF, CSV)' },
  ];

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
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
                    <Angry size={20} />
                  </AlertDialog.Icon>
                  <AlertDialog.Heading>Free Trial Limit Reached</AlertDialog.Heading>
                </AlertDialog.Header>

                <AlertDialog.Body className="text-center text-sm/relaxed text-(--color-text-secondary)">
                  You&apos;ve used your{' '}
                  <span className="font-semibold text-(--color-text-primary)">{limit}</span> free
                  evaluations. Create an account to continue assessing your circular economy
                  initiatives:
                  <ul className="mt-4 space-y-2 text-left">
                    {LIMIT_REACHED_DIALOG_POINTS.map((point, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <point.icon
                          size={16}
                          className="shrink-0 text-(--color-accent)"
                          aria-hidden="true"
                        />
                        <span className="text-(--color-text-primary)">{point.text}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      handleCancel();
                      close();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="teal"
                    onPress={() => {
                      handleSignUp();
                      close();
                    }}
                    className="flex-1"
                  >
                    Sign In
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

LimitReachedDialog.propTypes = {
  limit: PropTypes.number,
  message: PropTypes.string,
  isOpen: PropTypes.bool,
};
