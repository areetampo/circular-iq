/**
 * Section heading with optional live check count for uptime monitor blocks.
 */

import PropTypes from 'prop-types';

import { Separator } from '@/components/common';

/**
 * Uptime section title with optional live count and separator.
 */
export default function SectionLabel({ label, count, ...props }) {
  return (
    <div {...props}>
      <div className="flex items-baseline justify-between pb-2">
        <span className="pl-2 font-mono text-sm font-bold tracking-[0.14em] text-(--color-text-muted) uppercase">
          {label}
        </span>
        {count !== null && (
          <span className="font-mono text-sm font-bold text-(--color-text-muted)">{count}</span>
        )}
      </div>
      <Separator />
    </div>
  );
}

SectionLabel.propTypes = {
  /** Uppercase label displayed above the section separator. */
  label: PropTypes.string.isRequired,
  /** Optional count rendered on the right side of the label row. */
  count: PropTypes.number,
};
