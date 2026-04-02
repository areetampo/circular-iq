import PropTypes from 'prop-types';

function StatCard({ title, value, subtext, loading }) {
  if (loading) {
    return (
      <div className="border border-[rgba(180,160,130,0.25)] rounded-[12px] p-5 bg-transparent">
        <div className="h-7 w-16 rounded-md bg-[rgba(180,160,130,0.2)] animate-pulse" />
        <div className="h-2.5 w-20 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse mt-2" />
        {subtext && (
          <div className="h-3.5 w-24 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse mt-1" />
        )}
      </div>
    );
  }

  return (
    <div className="border border-[rgba(180,160,130,0.25)] rounded-[12px] p-5 bg-transparent">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-text-muted) mb-1">
        {title}
      </p>
      <p className="font-(--font-mono) text-[28px] font-semibold text-(--color-text-primary) tracking-[-0.02em] mt-2">
        {value ?? '—'}
      </p>
      {subtext && <p className="text-[12px] mt-1 text-(--color-text-muted)">{subtext}</p>}
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
