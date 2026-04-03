import { Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common/SectionHeading';

export function CircularEconomyTierCard({ actualResult }) {
  if (!actualResult?.circular_economy_tier) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      <SectionHeading variant="small" icon={<Target size={16} className="text-(--color-accent)" />}>
        Circular Economy Tier
      </SectionHeading>

      <div className="font-(--font-display) text-3xl text-(--color-text-primary) mb-1">
        {actualResult.circular_economy_tier.tier}
      </div>

      <div className="text-sm text-(--color-text-secondary) mb-3">
        Score range: {actualResult.circular_economy_tier.range} ·{' '}
        {actualResult.circular_economy_tier.percentile_estimate}
      </div>

      <div className="text-sm text-(--color-text-secondary) leading-relaxed mb-4">
        {actualResult.circular_economy_tier.description}
      </div>

      <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) italic leading-relaxed my-3">
        <span className="text-xs font-semibold text-(--color-text-muted)">Next Milestone: </span>
        <span className="text-xs text-(--color-text-primary)">
          {actualResult.circular_economy_tier.next_milestone}
        </span>
      </div>
    </div>
  );
}

CircularEconomyTierCard.propTypes = {
  actualResult: PropTypes.object,
};

export default CircularEconomyTierCard;
