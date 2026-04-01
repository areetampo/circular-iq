import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { DIALOGS } from '@/components/dialogs/dialogTypes';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { exportAssessmentPDF } from '@/features/export';
import { formatTimestamp } from '@/lib/formatting';

export default function AssessmentHeader({ assessment, isPublicShare, onConfirmDelete }) {
  const navigate = useNavigate();
  const { openDialog } = useGlobalDialog();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: back nav + title + timestamp */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm w-fit hover:text-(--color-text-primary) transition-colors duration-150 text-(--color-text-muted)"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold leading-tight text-(--color-text-primary)">
          {assessment?.title || 'Assessment'}
        </h1>
        {assessment?.created_at && (
          <p className="text-xs text-(--color-text-muted)">
            Saved {formatTimestamp(assessment.created_at)}
          </p>
        )}
      </div>

      {/* Right: action buttons — only shown for owned (non-public-share) assessments */}
      {!isPublicShare && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {/* Share */}
          {assessment?.public_id && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const shareUrl = `${window.location.origin}/share/${assessment.public_id}`;
                navigator.clipboard?.writeText(shareUrl).catch(() => {});
              }}
            >
              Copy Share Link
            </Button>
          )}

          {/* Export PDF */}
          <Button size="sm" variant="secondary" onClick={() => exportAssessmentPDF(assessment)}>
            Export PDF
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="danger-soft"
            onClick={() =>
              openDialog(DIALOGS.DELETE_ASSESSMENT, {
                assessmentName: assessment?.title,
                assessmentId: assessment?.id,
                onConfirm: onConfirmDelete,
              })
            }
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
