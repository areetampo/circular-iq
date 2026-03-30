import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

import ScoreCard from './ScoreCard';

export function RStrategyAlignmentCard({ actualResult }) {
  if (actualResult?.r_strategy_alignment?.alignment_score == null) return null;

  const { alignment_score, strategy, rating, message, misaligned_factors, well_aligned_factors } =
    actualResult.r_strategy_alignment;

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--success)';
    if (score >= 55) return 'var(--info)';
    if (score >= 35) return 'var(--warning)';
    return 'var(--danger)';
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
          <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
            Critical factors below threshold:
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {misaligned_factors.map((f) => (
              <Chip
                key={f}
                variant="default"
                className="text-xs"
                style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}
              >
                {formatFactorName(f)}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {well_aligned_factors.length > 0 && (
        <div>
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
            Well aligned:
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {well_aligned_factors.map((f) => (
              <Chip
                key={f}
                variant="default"
                className="text-xs"
                style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}
              >
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
