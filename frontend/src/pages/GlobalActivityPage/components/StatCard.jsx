import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';

/**
 * Stat card component for displaying metrics with loading states
 * @param {Object} props - Component props
 * @param {string} props.title - Label text displayed above the value
 * @param {string|number} props.value - Main numeric or text value to display
 * @param {string} [props.subtext] - Secondary text displayed below the value
 * @param {boolean} [props.loading] - Whether to show skeleton loading state
 */
export default function StatCard({ title, value, subtext, loading }) {
  // Format percentage values to 2 decimal places
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
  /** Label text displayed above the value */
  title: PropTypes.string.isRequired,
  /** Main numeric or text value to display */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Secondary text displayed below the value */
  subtext: PropTypes.string,
  /** Whether to show skeleton loading state */
  loading: PropTypes.bool,
};
