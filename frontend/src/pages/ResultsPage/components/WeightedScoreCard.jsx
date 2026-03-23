import { Card, Chip } from '@heroui/react';
import PropTypes from 'prop-types';

import { formatFactorName } from '@/lib/scoring';

export function WeightedScoreCard({ actualResult }) {
  if (!actualResult?.weighted_score_card) return null;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Score Contribution Breakdown</h3>
        <p className="text-sm text-slate-500 mb-4">
          How each factor contributed to your overall score of{' '}
          <span className="font-bold text-slate-800">{actualResult.overall_score}/100</span>
        </p>
        <div className="space-y-2">
          {Object.entries(actualResult.weighted_score_card.factors)
            .sort(([, a], [, b]) => b.contribution - a.contribution)
            .map(([key, factor]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-36 text-xs font-medium text-slate-600 truncate shrink-0">
                  {formatFactorName(key)}
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-2 relative overflow-hidden">
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
                <div className="text-xs text-slate-500 w-8 text-right shrink-0">
                  {factor.raw_score}
                </div>
                <div className="text-xs text-slate-400 w-10 text-right shrink-0">
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
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
          <span>
            Top contributor:{' '}
            <span className="font-semibold text-slate-700">
              {formatFactorName(actualResult.weighted_score_card.top_contributor)}
            </span>
          </span>
          <span>
            Needs most attention:{' '}
            <span className="font-semibold text-slate-700">
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
