import { Separator } from '@heroui/react';
import PropTypes from 'prop-types';

function DashboardSectionHeading({ label, count }) {
  return (
    <div className="my-8">
      <div className="flex items-baseline justify-between pb-2">
        <span className="pl-2 font-mono text-sm font-bold tracking-[0.14em] text-(--color-text-muted) uppercase">
          {label}
        </span>
        {count != null && <span className="text-sm text-(--color-text-muted)">{count}0</span>}
      </div>
      <Separator variant="secondary" />
    </div>
  );
}

DashboardSectionHeading.propTypes = {
  /** Main label text for the section */
  label: PropTypes.string.isRequired,
  /** Optional count to show on the right */
  count: PropTypes.number,
};

export { DashboardSectionHeading };
export default DashboardSectionHeading;
