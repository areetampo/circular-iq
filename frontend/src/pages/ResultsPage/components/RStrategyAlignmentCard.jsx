/**
 * @module RStrategyAlignmentCard
 * @description R-strategy alignment score and supporting rationale from the audit.
 */

import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

import ScoreCard from './ScoreCard';

/**
 * R-strategy alignment score and supporting rationale from the audit.
 *
 * @param {Object} props
 * @param {Object} props.actualResult
 * @returns {import('react').ReactElement}
 */
export default function RStrategyAlignmentCard({ actualResult }) {
  if (actualResult?.r_strategy_alignment?.alignment_score == null) return null;

  const { alignment_score, strategy, rating, message, misaligned_factors, well_aligned_factors } =
    actualResult.r_strategy_alignment;

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--color-score-high)';
    if (score >= 55) return 'var(--color-score-mid)';
    if (score >= 35) return 'var(--color-score-low)';
    return 'var(--color-score-fail)';
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
          <div className="mt-1 flex flex-wrap gap-1">
            {misaligned_factors.map((f) => (
              <Chip key={f} variant="factor" className="text-xs">
                {formatFactorName(f)}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {well_aligned_factors.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-(--color-success)">Well aligned:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {well_aligned_factors.map((f) => (
              <Chip key={f} variant="factor" className="text-xs">
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
