import { Card, Chip } from '@heroui/react';

import { formatFactorName } from '@/lib/scoring';

export default function RStrategyAlignmentCard({ scoringResult }) {
  if (scoringResult?.r_strategy_alignment?.alignment_score == null) return null;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">R-Strategy Alignment</h3>
            <p className="text-sm text-slate-500">
              How well your scores support the detected{' '}
              <span className="font-semibold">{scoringResult.r_strategy_alignment.strategy}</span>{' '}
              strategy
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-bold ${
                scoringResult.r_strategy_alignment.alignment_score >= 75
                  ? 'text-green-600'
                  : scoringResult.r_strategy_alignment.alignment_score >= 55
                    ? 'text-blue-600'
                    : scoringResult.r_strategy_alignment.alignment_score >= 35
                      ? 'text-amber-600'
                      : 'text-red-600'
              }`}
            >
              {scoringResult.r_strategy_alignment.alignment_score}
              <span className="text-sm text-slate-400">/100</span>
            </div>
            <div className="text-xs text-slate-500">
              {scoringResult.r_strategy_alignment.rating}
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-700 mb-3">{scoringResult.r_strategy_alignment.message}</p>
        {scoringResult.r_strategy_alignment.misaligned_factors?.length > 0 && (
          <div className="mb-2">
            <span className="text-xs font-semibold text-red-600">
              Critical factors below threshold:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {scoringResult.r_strategy_alignment.misaligned_factors.map((f) => (
                <Chip key={f} size="sm" variant="soft" className="text-xs text-red-700 bg-red-100">
                  {formatFactorName(f)}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {scoringResult.r_strategy_alignment.well_aligned_factors?.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-green-600">Well aligned:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {scoringResult.r_strategy_alignment.well_aligned_factors.map((f) => (
                <Chip
                  key={f}
                  size="sm"
                  variant="soft"
                  className="text-xs text-green-700 bg-green-100"
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
