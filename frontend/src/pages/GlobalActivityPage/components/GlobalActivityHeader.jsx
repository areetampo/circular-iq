import { Globe, RotateCw } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button } from '@/components/common';
import { useGlobalStats } from '@/features/assessments/hooks';
import { useRelativeTime } from '@/hooks';
import { cn } from '@/utils/cn';

/**
 * Global activity page header with refresh functionality
 * @param {Object} props - Component props
 * @param {string} [props.title] - Page title
 * @param {string} [props.description] - Page description
 */
export default function GlobalActivityHeader({ title, description }) {
  // ── Global data ─────────────────────────────────────────────────────────────
  const {
    isLoading: globalLoading,
    isFetching,
    refetch: refetchGlobal,
    dataUpdatedAt,
  } = useGlobalStats();

  // Convert ms timestamp to Date object for your useRelativeTime hook
  const updatedAtDate = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();
  const relativeTime = useRelativeTime(updatedAtDate);

  // Refresh handler – no local state needed at all
  const handleRefresh = async () => {
    await refetchGlobal();
    // dataUpdatedAt will be updated automatically by React Query
  };

  // Loading indicator: use React Query's flags only
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
  /** Page title */
  title: PropTypes.string.isRequired,
  /** Page description */
  description: PropTypes.string.isRequired,
};
