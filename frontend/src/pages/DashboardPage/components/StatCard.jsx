import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';

function StatCard({ title, value, subtext, loading }) {
  if (loading) {
    return (
      <div className="border border-(--color-border) rounded-md p-5 card-lift bg-transparent">
        <Skeleton className="h-7 w-16 rounded" />
        <Skeleton className="h-2.5 w-20 rounded" />
        {subtext && <Skeleton className="h-3.5 w-24 rounded" />}
      </div>
    );
  }

  return (
    <div className="border border-(--color-border) rounded-md p-5 card-lift bg-transparent">
      <p className="label-overline">{title}</p>
      <p className="metric-value text-[28px] font-medium mt-2 text-(--color-text-primary)">
        {value ?? '—'}
      </p>
      {subtext && <p className="text-xs mt-1 text-(--color-text-muted)">{subtext}</p>}
    </div>
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

export { StatCard };
export default StatCard;
