/**
 * Displays circular economy tier classification and explanatory copy.
 */

import { Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';

/**
 * Tier level, score range, percentile, description, and next milestone from `actualResult`.
 * Returns null when `actualResult.circular_economy_tier` is missing.
 */
export default function CircularEconomyTierCard({ actualResult, ...props }) {
  if (!actualResult?.circular_economy_tier) return null;

  return (
    <div {...props}>
      <SectionHeading variant="small" icon={<Target size={16} className="text-(--color-accent)" />}>
        Circular Economy Tier
      </SectionHeading>

      <div className="mb-1 font-display text-3xl font-bold text-(--color-text-primary)">
        {actualResult.circular_economy_tier.tier}
      </div>

      <div className="mb-3 text-sm text-(--color-text-secondary)">
        Score range: {actualResult.circular_economy_tier.range} ·{' '}
        {actualResult.circular_economy_tier.percentile_estimate}
      </div>

      <div className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
        {actualResult.circular_economy_tier.description}
      </div>

      <div className="my-3 border-l-2 border-(--color-accent) py-1 pl-3 text-sm/relaxed text-(--color-text-secondary) italic">
        <span className="text-sm font-semibold text-(--color-text-muted)">Next Milestone: </span>
        <span className="text-sm text-(--color-text-primary)">
          {actualResult.circular_economy_tier.next_milestone}
        </span>
      </div>
    </div>
  );
}

CircularEconomyTierCard.propTypes = {
  actualResult: PropTypes.object,
};
