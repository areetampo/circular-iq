import PropTypes from 'prop-types';

function SectionDivider({ label, count }) {
  return (
    <div className="flex items-baseline justify-between border-b-2 border-(--color-border) my-8 pb-2">
      <span className="label-overline text-[0.75rem]! font-mono! uppercase!">{label}</span>
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
