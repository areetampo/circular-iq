/**
 * Section title styling for grouped charts on the Global Activity page.
 */

import PropTypes from 'prop-types';

import { Separator } from '@/components/common';

/**
 * Renders an uppercase dashboard section label with an optional right-aligned count.
 */
export default function DashboardSectionHeading({ label, count }) {
  return (
    <div className="my-8">
      <div className="flex items-baseline justify-between pb-2">
        <span className="pl-2 font-mono text-sm font-bold tracking-[0.14em] text-(--color-text-muted) uppercase">
          {label}
        </span>
        {count !== null && <span className="text-sm text-(--color-text-muted)">{count}</span>}
      </div>
      <Separator />
    </div>
  );
}

DashboardSectionHeading.propTypes = {
  /** Section label displayed in uppercase */
  label: PropTypes.string.isRequired,
  /** Optional non-null count displayed on the right side of the heading */
  count: PropTypes.number,
};
