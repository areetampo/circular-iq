/** Sign-in prompt shown when anonymous users reach the scoring limit. */

import { AlertDialog } from '@heroui/react';
import { Angry, FileDown, InfinityIcon, Orbit, Save, Share, TextSearch } from 'lucide-react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { formatDuration } from '@/lib/formatting';

/**
 * Renders the anonymous scoring-limit dialog with reset countdown and account feature highlights.
 */
export default function LimitReachedDialog({
  lastUsedAt,
  anonScoringLimit,
  anonScoringUsageRetentionDays,
}) {
  const { isDialogOpen, onClose } = useGlobalDialog();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isDialogOpen) {
    return null;
  }

  const targetTime =
    new Date(lastUsedAt).getTime() + anonScoringUsageRetentionDays * 24 * 60 * 60 * 1000;
  const timeRemainingMs = targetTime - Date.now();

  // Hide seconds and milliseconds so the reset copy stays stable while the modal is open.
  const formattedTimeLeft = formatDuration({
    ms: timeRemainingMs,
    showSeconds: false,
    showMs: false,
  });

  const LIMIT_REACHED_DIALOG_POINTS = [
    { icon: InfinityIcon, text: 'Unlimited evaluations' },
    { icon: TextSearch, text: 'Search circular economy solutions' },
    { icon: Orbit, text: 'Access global activity analytics' },
    { icon: Share, text: 'Share assessments' },
    { icon: Save, text: 'Save and compare results' },
    { icon: FileDown, text: 'Export reports (PDF, CSV)' },
  ];

  const handleSignUp = () => {
    onClose();
    navigate('/auth', { state: { view: 'signup', from: location } });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={true}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog>
            {() => (
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
                  <span className="font-medium text-(--color-text-primary)">
                    {anonScoringLimit}
                  </span>{' '}
                  free evaluations. Try again in{' '}
                  <span className="font-medium text-(--color-text-primary)">
                    {formattedTimeLeft}
                  </span>{' '}
                  or create an account to continue assessing your circular economy initiatives:
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
                  <Button variant="ghost" onPress={handleClose} className="flex-1">
                    Close
                  </Button>
                  <Button variant="teal" onPress={handleSignUp} className="flex-1">
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
  lastUsedAt: PropTypes.string,
  anonScoringLimit: PropTypes.number,
  anonScoringUsageRetentionDays: PropTypes.number,
};
