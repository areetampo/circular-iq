import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AlertDialog } from '@heroui/react';
import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import {
  Check,
  TriangleAlert,
  Infinity,
  Skull,
  OctagonX,
  Share2,
  Save,
  Globe,
  Share,
  Orbit,
  FileDown,
} from 'lucide-react';

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
    { icon: Infinity, text: 'Unlimited evaluations' },
    { icon: Share, text: 'Share assessments' },
    { icon: Save, text: 'Save and compare results' },
    { icon: Orbit, text: 'Access dashboard analytics' },
    { icon: FileDown, text: 'Export reports (PDF, CSV)' },
  ];

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
                <AlertDialog.Icon status="danger">
                  <OctagonX size={25} />
                </AlertDialog.Icon>
                <AlertDialog.Heading className="text-red-600">
                  Free Trial Limit Reached
                </AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="space-y-3">
                <p className="text-sm text-slate-500 font-medium">
                  You&apos;ve used your <span className="font-bold">{limit}</span> free evaluations.
                  Create an account to continue assessing your circular economy initiatives:
                </p>
                <ul className="mt-2 space-y-2.5">
                  {LIMIT_REACHED_DIALOG_POINTS.map((point, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <point.icon size={18} className="text-green-600" aria-hidden="true" />
                      <span className="text-gray-700">{point.text}</span>
                    </li>
                  ))}
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
                  Sign In
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
