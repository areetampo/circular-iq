import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { DIALOGS } from '@/components/dialogs/dialogTypes';
import { useGlobalDialog } from '@/contexts/DialogContext';
import { updateAssessment } from '@/features/assessments/api/assessmentApi';
import { exportAssessmentPDF } from '@/features/export';
import { formatTimestamp } from '@/lib/formatting';

export default function AssessmentHeader({ assessment, isPublicShare, onConfirmDelete }) {
  const navigate = useNavigate();
  const { openDialog } = useGlobalDialog();
  const queryClient = useQueryClient();

  const togglePublicMutation = useMutation({
    mutationFn: updateAssessment,
    onSuccess: async () => {
      console.log('Public toggle succeeded from results page');

      // On results page, refetch the assessments list to update the list view
      await queryClient.refetchQueries({ queryKey: ['assessments'] });
      console.log('Refetched assessments list from results page');

      // Also refetch stats to keep them in sync
      await queryClient.refetchQueries({ queryKey: ['assessmentStats'] });
      console.log('Refetched assessment stats from results page');

      // Also invalidate specific public assessment if it exists
      if (assessment?.public_id) {
        queryClient.invalidateQueries({ queryKey: ['publicAssessment', assessment.public_id] });
        console.log('Invalidated specific public assessment:', assessment.public_id);
      }
    },
    onError: (error) => {
      console.error('Failed to update assessment:', error);
    },
  });

  const handleTogglePublic = () => {
    if (!assessment?.id) return;
    togglePublicMutation.mutate({
      id: assessment.id,
      is_public: !assessment.is_public,
    });
  };

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

        {/* Public/Private toggle - show for both owned and shared assessments */}
        {assessment?.id && (
          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={assessment.is_public}
                onChange={handleTogglePublic}
                className="w-4 h-4 accent-(--color-accent) cursor-pointer"
              />
              <span>Public</span>
            </label>
          </div>
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
              onPress={() => {
                const shareUrl = `${window.location.origin}/share/${assessment.public_id}`;
                navigator.clipboard?.writeText(shareUrl).catch(() => {});
              }}
            >
              Copy Share Link
            </Button>
          )}

          {/* Export PDF */}
          <Button size="sm" variant="secondary" onPress={() => exportAssessmentPDF(assessment)}>
            Export PDF
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() =>
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
