import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

export default function RStrategyAlignmentCard({ scoringResult }) {
  if (scoringResult?.r_strategy_alignment?.alignment_score == null) return null;

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6">
        R-Strategy Alignment
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm text-(--color-text-muted) mb-2">
              How well your scores support the detected{' '}
              <span className="font-semibold text-(--color-text-primary)">
                {scoringResult.r_strategy_alignment.strategy}
              </span>{' '}
              strategy
            </p>
            <p className="text-sm text-(--color-text-secondary) leading-relaxed">
              {scoringResult.r_strategy_alignment.message}
            </p>
          </div>
          <div className="text-right ml-8">
            <h3 className="font-bold text-(--color-text-primary) text-lg mb-3">
              {scoringResult.r_strategy_alignment.alignment_score}
              <span className="text-sm text-(--color-text-muted) font-normal">/100</span>
            </h3>
            <div className="text-xs text-(--color-text-muted) mt-1">
              {scoringResult.r_strategy_alignment.rating}
            </div>
          </div>
        </div>

        {scoringResult.r_strategy_alignment.misaligned_factors?.length > 0 && (
          <div className="border-l-2 border-(--color-error) pl-3 py-1">
            <span className="text-xs font-semibold text-(--color-error) block mb-2">
              Critical factors below threshold:
            </span>
            <div className="flex flex-wrap gap-1">
              {scoringResult.r_strategy_alignment.misaligned_factors.map((f) => (
                <Chip key={f} variant="tag">
                  {formatFactorName(f)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {scoringResult.r_strategy_alignment.well_aligned_factors?.length > 0 && (
          <div className="border-l-2 border-(--color-success) pl-3 py-1">
            <span className="text-xs font-semibold text-(--color-success) block mb-2">
              Well aligned:
            </span>
            <div className="flex flex-wrap gap-1">
              {scoringResult.r_strategy_alignment.well_aligned_factors.map((f) => (
                <Chip key={f} variant="tag">
                  {formatFactorName(f)}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

RStrategyAlignmentCard.propTypes = {
  scoringResult: PropTypes.object.isRequired,
};
