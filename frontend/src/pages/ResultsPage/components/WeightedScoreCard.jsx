import { TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

export function WeightedScoreCard({ actualResult }) {
  if (!actualResult?.weighted_score_card) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      {/* Section heading with icon */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-(--color-accent)" />
        <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted)">
          Score Contribution Breakdown
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-(--color-text-secondary) mb-6">
        How each factor contributed to your overall score of{' '}
        <span className="font-mono text-(--color-text-primary)">
          {actualResult.overall_score}/100
        </span>
      </p>

      {/* Factors list */}
      <div className="space-y-3">
        {Object.entries(actualResult.weighted_score_card.factors)
          .sort(([, a], [, b]) => b.contribution - a.contribution)
          .map(([key, factor]) => (
            <div
              key={key}
              className="flex items-center gap-3 py-2 border-b border-(--color-border) last:border-0"
            >
              <div className="w-36 text-xs font-medium truncate shrink-0 text-(--color-text-muted)">
                {formatFactorName(key)}
              </div>
              <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border)">
                <div
                  className="h-1.5 rounded-full bg-(--color-accent)"
                  style={{ width: `${factor.raw_score}%` }}
                />
              </div>
              <div className="text-xs w-8 text-right shrink-0 font-mono text-(--color-text-primary)">
                {factor.raw_score}
              </div>
              <div className="text-xs w-10 text-right shrink-0 text-(--color-text-muted)">
                +{factor.contribution}
              </div>
              <Chip variant="tag" className="shrink-0">
                {factor.classification}
              </Chip>
            </div>
          ))}
      </div>

      {/* Bottom summary */}
      <div className="mt-6 pt-4 border-t border-(--color-border) flex justify-between text-xs text-(--color-text-muted)">
        <span>
          Top contributor:{' '}
          <span className="font-semibold text-(--color-text-primary)">
            {formatFactorName(actualResult.weighted_score_card.top_contributor)}
          </span>
        </span>
        <span>
          Needs most attention:{' '}
          <span className="font-semibold text-(--color-text-primary)">
            {formatFactorName(actualResult.weighted_score_card.bottom_contributor)}
          </span>
        </span>
      </div>
    </div>
  );
}

WeightedScoreCard.propTypes = {
  actualResult: PropTypes.object,
};

export default WeightedScoreCard;
