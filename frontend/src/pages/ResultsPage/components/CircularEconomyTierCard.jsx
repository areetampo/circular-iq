import { Card } from '@heroui/react';
import PropTypes from 'prop-types';

export function CircularEconomyTierCard({ actualResult }) {
  if (!actualResult?.circular_economy_tier) return null;

  return (
    <Card
      className={`border-2 shadow-sm rounded-xl ${
        actualResult.circular_economy_tier.badge_color === 'green'
          ? 'border-green-300 bg-green-50'
          : actualResult.circular_economy_tier.badge_color === 'blue'
            ? 'border-blue-300 bg-blue-50'
            : actualResult.circular_economy_tier.badge_color === 'amber'
              ? 'border-amber-300 bg-amber-50'
              : 'border-red-300 bg-red-50'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Circular Economy Tier
            </span>
            <h3
              className={`text-2xl font-bold mt-0.5 ${
                actualResult.circular_economy_tier.badge_color === 'green'
                  ? 'text-green-700'
                  : actualResult.circular_economy_tier.badge_color === 'blue'
                    ? 'text-blue-700'
                    : actualResult.circular_economy_tier.badge_color === 'amber'
                      ? 'text-amber-700'
                      : 'text-red-700'
              }`}
            >
              {actualResult.circular_economy_tier.tier}
            </h3>
            <span className="text-xs text-slate-500">
              Score range: {actualResult.circular_economy_tier.range}
              {' · '}
              {actualResult.circular_economy_tier.percentile_estimate}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-700 mb-2">
          {actualResult.circular_economy_tier.description}
        </p>
        <div className="p-3 bg-white/60 rounded-lg border border-current/10">
          <span className="text-xs font-semibold text-slate-600">Next Milestone: </span>
          <span className="text-xs text-slate-700">
            {actualResult.circular_economy_tier.next_milestone}
          </span>
        </div>
      </div>
    </Card>
  );
}

CircularEconomyTierCard.propTypes = {
  actualResult: PropTypes.object,
};

export default CircularEconomyTierCard;
