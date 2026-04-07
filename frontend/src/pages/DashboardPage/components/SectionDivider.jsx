import PropTypes from 'prop-types';

function SectionDivider({ label, count }) {
  return (
    <div className="my-8 flex items-baseline justify-between border-b-2 border-border pb-2">
      <span className="label-overline font-mono! text-[0.75rem]! uppercase!">{label}</span>
      {count == null && <span className="text-sm text-(--color-text-muted)">{count}0</span>}
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
