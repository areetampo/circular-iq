/**
 * KPI metric tile with optional loading skeleton for the Global Activity dashboard.
 */

import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';

/**
 * Renders a dashboard metric tile or a matching skeleton while data is loading.
 */
export default function StatCard({ title, value, subtext, loading }) {
  // Keep percentage tiles visually consistent even when callers pass raw formatted strings.
  const formatValue = (val) => {
    if (typeof val === 'string' && val.includes('%')) {
      const numValue = parseFloat(val.replace('%', ''));
      if (!isNaN(numValue)) {
        return `${numValue.toFixed(1)}%`;
      }
    }
    return val;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-start justify-center gap-3.5 rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5">
        <Skeleton className="h-3.5 w-24 rounded-md" />
        <Skeleton className="h-8 w-18 rounded-md" />
        {subtext && <Skeleton className="h-3.5 w-32 rounded-md" />}
      </div>
    );
  }

  const formattedValue = formatValue(value);

  return (
    <Tilt3D block className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5">
      <p className="mb-1 text-[0.625rem] font-semibold tracking-widest text-(--color-text-muted) uppercase">
        {title}
      </p>
      <p className="mt-2 font-mono text-[1.5rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
        {formattedValue ?? '—'}
      </p>
      {subtext && <p className="mt-1 text-[0.75rem] text-(--color-text-muted)">{subtext}</p>}
    </Tilt3D>
  );
}

StatCard.propTypes = {
  /** Label text displayed above the metric value */
  title: PropTypes.string.isRequired,
  /** Main metric value; percentage strings are normalized to one decimal place */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Supporting text displayed below the metric value */
  subtext: PropTypes.string,
  /** Whether to show the skeleton tile instead of metric content */
  loading: PropTypes.bool,
};
