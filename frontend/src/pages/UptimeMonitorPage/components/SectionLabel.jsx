import PropTypes from 'prop-types';

import { Separator } from '@/components/common';

/**
 * SectionLabel - A section header component with label and optional count
 * Displays a section title with an optional count and a separator below
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Section label text to display
 * @param {number} [props.count] - Optional count to display next to the label
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered SectionLabel
 *
 * @example
 * Basic usage
 * <SectionLabel label="Endpoints" count={5} />
 *
 * @example
 * Without count
 * <SectionLabel label="Health Status" />
 */
export default function SectionLabel({ label, count, ...props }) {
  return (
    <div {...props}>
      <div className="flex items-baseline justify-between pb-2">
        <span className="pl-2 font-mono text-sm font-bold tracking-[0.14em] text-(--color-text-muted) uppercase">
          {label}
        </span>
        {count != null && <span className="text-sm text-(--color-text-muted)">{count}</span>}
      </div>
      <Separator />
    </div>
  );
}

SectionLabel.propTypes = {
  /** Section label text to display */
  label: PropTypes.string.isRequired,
  /** Optional count to display next to the label */
  count: PropTypes.number,
};
