import { Card } from '@heroui/react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

export default function RStrategyAlignmentCard({ scoringResult }) {
  if (scoringResult?.r_strategy_alignment?.alignment_score == null) return null;

  return (
    <Card
      className="border rounded-xl card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              R-Strategy Alignment
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              How well your scores support the detected{' '}
              <span className="font-semibold">{scoringResult.r_strategy_alignment.strategy}</span>{' '}
              strategy
            </p>
          </div>
          <div className="text-right">
            <div
              style={{
                color:
                  scoringResult.r_strategy_alignment.alignment_score >= 75
                    ? 'var(--success)'
                    : scoringResult.r_strategy_alignment.alignment_score >= 55
                      ? 'var(--info)'
                      : scoringResult.r_strategy_alignment.alignment_score >= 35
                        ? 'var(--warning)'
                        : 'var(--danger)',
              }}
            >
              {scoringResult.r_strategy_alignment.alignment_score}
              <span style={{ color: 'var(--muted)' }} className="text-sm">
                /100
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {scoringResult.r_strategy_alignment.rating}
            </div>
          </div>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {scoringResult.r_strategy_alignment.message}
        </p>
        {scoringResult.r_strategy_alignment.misaligned_factors?.length > 0 && (
          <div className="mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
              Critical factors below threshold:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {scoringResult.r_strategy_alignment.misaligned_factors.map((f) => (
                <Chip
                  key={f}
                  variant="default"
                  style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}
                >
                  {formatFactorName(f)}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {scoringResult.r_strategy_alignment.well_aligned_factors?.length > 0 && (
          <div>
            <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
              Well aligned:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {scoringResult.r_strategy_alignment.well_aligned_factors.map((f) => (
                <Chip
                  key={f}
                  variant="default"
                  style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}
                >
                  {formatFactorName(f)}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

RStrategyAlignmentCard.propTypes = {
  scoringResult: PropTypes.object.isRequired,
};
