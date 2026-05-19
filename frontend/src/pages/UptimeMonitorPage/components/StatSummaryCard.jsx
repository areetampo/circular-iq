/**
 * @module StatSummaryCard
 * @description Summary stat tile (uptime %, latency) for the uptime monitor header.
 */

import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';

/**
 * StatSummaryCard - A card component for displaying statistical information
 * Displays title, value, and optional subtext in a styled card with 3D tilt effect
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Title text displayed at the top of the card
 * @param {string|number} props.value - Main value to display (shows '—' if null/undefined)
 * @param {string} [props.subtext] - Optional subtext displayed below the main value
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered StatSummaryCard
 *
 * @example
 * Basic usage
 * <StatSummaryCard title="Uptime" value="99.9%" subtext="Last 30 days" />
 *
 * @example
 * With missing value
 * <StatSummaryCard title="Response Time" value={null} />
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
  /** Title text displayed at the top of the card */
  title: PropTypes.string.isRequired,
  /** Main value to display (shows '—' if null/undefined) */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Optional subtext displayed below the main value */
  subtext: PropTypes.string,
};
