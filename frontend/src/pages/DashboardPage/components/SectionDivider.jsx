import PropTypes from 'prop-types';

function SectionDivider({ label, count }) {
  return (
    <div
      className="flex items-baseline justify-between border-b pb-2 mb-5"
      style={{ borderColor: 'var(--border)' }}
    >
      <span className="label-overline">{label}</span>
      {count != null && (
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {count}
        </span>
      )}
    </div>
  );
}

SectionDivider.propTypes = {
  /** Main label text for the section */
  label: PropTypes.string.isRequired,
  /** Optional count to show on the right */
  count: PropTypes.number,
};

export { SectionDivider };
export default SectionDivider;
