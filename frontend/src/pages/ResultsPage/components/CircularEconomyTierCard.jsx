import { Card } from '@heroui/react';
import PropTypes from 'prop-types';

export function CircularEconomyTierCard({ actualResult }) {
  if (!actualResult?.circular_economy_tier) return null;

  return (
    <Card
      className="border-2 rounded-xl card-lift"
      style={{
        borderColor:
          actualResult.circular_economy_tier.badge_color === 'green'
            ? 'var(--success)'
            : actualResult.circular_economy_tier.badge_color === 'blue'
              ? 'var(--info)'
              : actualResult.circular_economy_tier.badge_color === 'amber'
                ? 'var(--warning)'
                : 'var(--danger)',
        backgroundColor:
          actualResult.circular_economy_tier.badge_color === 'green'
            ? 'var(--success-soft)'
            : actualResult.circular_economy_tier.badge_color === 'blue'
              ? 'var(--info-soft)'
              : actualResult.circular_economy_tier.badge_color === 'amber'
                ? 'var(--warning-soft)'
                : 'var(--danger-soft)',
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted)' }}
            >
              Circular Economy Tier
            </span>
            <h3
              className="text-2xl font-bold mt-0.5"
              style={{
                color:
                  actualResult.circular_economy_tier.badge_color === 'green'
                    ? 'var(--success)'
                    : actualResult.circular_economy_tier.badge_color === 'blue'
                      ? 'var(--info)'
                      : actualResult.circular_economy_tier.badge_color === 'amber'
                        ? 'var(--warning)'
                        : 'var(--danger)',
              }}
            >
              {actualResult.circular_economy_tier.tier}
            </h3>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Score range: {actualResult.circular_economy_tier.range}
              {' · '}
              {actualResult.circular_economy_tier.percentile_estimate}
            </span>
          </div>
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
          {actualResult.circular_economy_tier.description}
        </p>
        <div
          className="p-3 rounded-lg border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            Next Milestone:{' '}
          </span>
          <span className="text-xs" style={{ color: 'var(--foreground)' }}>
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
