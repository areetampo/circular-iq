import PropTypes from 'prop-types';

function StatCard({ title, value, subtext, loading }) {
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
      <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5">
        <div className="h-7 w-16 animate-pulse rounded-md bg-(--color-skeleton-pulse-lg)" />
        <div className="mt-2 h-2.5 w-20 animate-pulse rounded-md bg-(--color-skeleton-pulse-md)" />
        {subtext && (
          <div className="mt-1 h-3.5 w-24 animate-pulse rounded-md bg-(--color-skeleton-pulse-md)" />
        )}
      </div>
    );
  }

  const formattedValue = formatValue(value);

  return (
    <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5">
      <p className="mb-1 text-[0.625rem] font-semibold tracking-widest text-(--color-text-muted) uppercase">
        {title}
      </p>
      <p className="mt-2 font-mono text-[1.5rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
        {formattedValue ?? '—'}
      </p>
      {subtext && <p className="mt-1 text-[0.75rem] text-(--color-text-muted)">{subtext}</p>}
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
