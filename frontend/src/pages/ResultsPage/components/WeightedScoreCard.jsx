import { Card, Chip } from '@heroui/react';
import PropTypes from 'prop-types';

import { formatFactorName } from '@/lib/scoring';

export function WeightedScoreCard({ actualResult }) {
  if (!actualResult?.weighted_score_card) return null;

  return (
    <Card
      className="border rounded-xl shadow-sm"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Score Contribution Breakdown
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          How each factor contributed to your overall score of{' '}
          <span className="font-bold" style={{ color: 'var(--foreground)' }}>
            {actualResult.overall_score}/100
          </span>
        </p>
        <div className="space-y-2">
          {Object.entries(actualResult.weighted_score_card.factors)
            .sort(([, a], [, b]) => b.contribution - a.contribution)
            .map(([key, factor]) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className="w-36 text-xs font-medium truncate shrink-0"
                  style={{ color: 'var(--muted)' }}
                >
                  {formatFactorName(key)}
                </div>
                <div
                  className="flex-1 rounded-full h-2 relative overflow-hidden"
                  style={{ backgroundColor: 'var(--border)' }}
                >
                  <div
                    className={`h-2 rounded-full ${
                      factor.classification === 'Strong'
                        ? 'bg-green-500'
                        : factor.classification === 'Moderate'
                          ? 'bg-blue-500'
                          : factor.classification === 'Weak'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                    }`}
                    style={{ width: `${factor.raw_score}%` }}
                  />
                </div>
                <div className="text-xs w-8 text-right shrink-0" style={{ color: 'var(--muted)' }}>
                  {factor.raw_score}
                </div>
                <div
                  className="text-xs w-10 text-right shrink-0"
                  style={{ color: 'var(--subtle)' }}
                >
                  +{factor.contribution}
                </div>
                <Chip
                  variant="soft"
                  size="sm"
                  className={`text-xs shrink-0 ${
                    factor.classification === 'Strong'
                      ? 'text-green-700 bg-green-100'
                      : factor.classification === 'Moderate'
                        ? 'text-blue-700 bg-blue-100'
                        : factor.classification === 'Weak'
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-red-700 bg-red-100'
                  }`}
                >
                  {factor.classification}
                </Chip>
              </div>
            ))}
        </div>
        <div
          className="mt-3 pt-3 border-t flex justify-between text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <span>
            Top contributor:{' '}
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
              {formatFactorName(actualResult.weighted_score_card.top_contributor)}
            </span>
          </span>
          <span>
            Needs most attention:{' '}
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
              {formatFactorName(actualResult.weighted_score_card.bottom_contributor)}
            </span>
          </span>
        </div>
      </div>
    </Card>
  );
}

WeightedScoreCard.propTypes = {
  actualResult: PropTypes.object,
};

export default WeightedScoreCard;
