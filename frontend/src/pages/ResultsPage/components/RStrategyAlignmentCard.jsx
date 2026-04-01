import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

import ScoreCard from './ScoreCard';

export function RStrategyAlignmentCard({ actualResult }) {
  if (actualResult?.r_strategy_alignment?.alignment_score == null) return null;

  const { alignment_score, strategy, rating, message, misaligned_factors, well_aligned_factors } =
    actualResult.r_strategy_alignment;

  const getScoreColor = (score) => {
    if (score >= 75) return '#6b8f71';
    if (score >= 55) return '#7a9eb5';
    if (score >= 35) return '#d4b896';
    return '#c4956a';
  };

  return (
    <ScoreCard
      title="R-Strategy Alignment"
      description={`How well your scores support the detected ${strategy} strategy`}
      score={alignment_score}
      rating={rating}
      message={message}
      scoreColor={getScoreColor(alignment_score)}
    >
      {misaligned_factors.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-(--color-error)">
            Critical factors below threshold:
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {misaligned_factors.map((f) => (
              <Chip key={f} variant="tag" className="text-xs">
                {formatFactorName(f)}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {well_aligned_factors.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-(--color-success)">Well aligned:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {well_aligned_factors.map((f) => (
              <Chip key={f} variant="tag" className="text-xs">
                {formatFactorName(f)}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </ScoreCard>
  );
}

RStrategyAlignmentCard.propTypes = {
  actualResult: PropTypes.object,
};

export default RStrategyAlignmentCard;
