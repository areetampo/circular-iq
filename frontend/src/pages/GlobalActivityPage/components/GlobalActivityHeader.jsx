/**
 * Global Activity dashboard header with refresh state and last-updated copy.
 */

import { Globe, RotateCw } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button } from '@/components/common';
import { useGlobalStats } from '@/features/assessments/hooks';
import { useRelativeTime } from '@/hooks';
import { cn } from '@/utils/cn';

/**
 * Renders the dashboard title, description, refresh action, and relative update timestamp.
 */
export default function GlobalActivityHeader({ title, description }) {
  // ── Global data ─────────────────────────────────────────────────────────────
  const {
    isLoading: globalLoading,
    isFetching,
    refetch: refetchGlobal,
    dataUpdatedAt,
  } = useGlobalStats();

  // React Query stores update time in milliseconds; useRelativeTime expects a Date.
  const updatedAtDate = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();
  const relativeTime = useRelativeTime(updatedAtDate);

  // Refetch delegates loading and update timestamps to React Query.
  const handleRefresh = async () => {
    await refetchGlobal();
  };

  // React Query exposes both first-load and background-refresh states for the button.
  const showUpdating = globalLoading || isFetching;

  return (
    <div className="flex items-end justify-between gap-4 pt-6">
      <div>
        <h1 className="flex items-center gap-3 font-sans text-[2rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
          <Globe size={28} className="text-(--color-success)" strokeWidth={2.5} />
          {title}
        </h1>
        <p className="pl-1 text-sm/relaxed text-(--color-text-secondary)">{description}</p>
      </div>

      {/* Refresh button + updated at timestamp */}
      <div
        className={cn(
          'flex flex-col items-end justify-center gap-2',
          globalLoading && 'items-center',
        )}
      >
        <Button
          variant="success-soft"
          isLoading={showUpdating}
          icon={RotateCw}
          loadingIcon={RotateCw}
          spinLoadingIcon
          loadingIconInline
          onPress={handleRefresh}
          isDisabled={showUpdating}
        >
          Refresh
        </Button>
        <p className="font-mono text-[0.65rem] font-medium text-(--color-text-muted)">
          {showUpdating ? 'updating...' : `updated ${relativeTime}`}
        </p>
      </div>
    </div>
  );
}

GlobalActivityHeader.propTypes = {
  /** Heading text displayed beside the globe icon */
  title: PropTypes.string.isRequired,
  /** Introductory copy displayed below the heading */
  description: PropTypes.string.isRequired,
};
