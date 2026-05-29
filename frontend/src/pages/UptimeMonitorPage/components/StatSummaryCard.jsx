/**
 * Summary stat tile (uptime %, latency) for the uptime monitor header.
 */

import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';

/**
 * Tilt card for a single uptime summary metric; shows em dash when `value` is nullish.
 */
export default function StatSummaryCard({ title, value, subtext, ...props }) {
  return (
    <Tilt3D
      {...props}
      block
      className="flex flex-col items-start justify-center gap-1.5 rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5"
    >
      <p className="font-mono text-[0.625rem] font-semibold tracking-widest text-(--color-text-muted) uppercase">
        {title}
      </p>
      <p className="font-mono text-2xl font-medium tracking-[-0.02em] text-(--color-text-primary)">
        {value ?? '—'}
      </p>
      {subtext && <p className="text-xs text-(--color-text-muted)">{subtext}</p>}
    </Tilt3D>
  );
}

StatSummaryCard.propTypes = {
  /** Small uppercase metric title displayed at the top of the card. */
  title: PropTypes.string.isRequired,
  /** Main metric value; nullish values render as an em dash. */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Optional context line displayed below the main value. */
  subtext: PropTypes.string,
};
