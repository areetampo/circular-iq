import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import BenchmarkTable from '@/components/results/BenchmarkTable';
import { formatFactorName } from '@/lib/scoring';

export function GapAnalysisCard({ result, variant = 'default' }) {
  const gapAnalysis = result?.gap_analysis;
  if (!gapAnalysis?.has_benchmarks) return null;

  const isTransparent = variant === 'transparent';

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
      <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
        <BarChart3 size={14} />
        Gap Analysis
      </p>

      {variant === 'transparent' && (
        <p className="text-sm text-(--color-text-secondary) mb-6 leading-relaxed">
          {gapAnalysis.message}
        </p>
      )}

      <BenchmarkTable
        comparisons={gapAnalysis.comparisons}
        opportunities={gapAnalysis.opportunities}
        strengths={gapAnalysis.strengths}
      />

      {variant === 'assessment' && (
        <div className="flex flex-wrap gap-2 mt-6">
          {gapAnalysis.opportunities?.map((factor) => (
            <Chip key={factor} variant="warning">
              ↑ {formatFactorName(factor)}
            </Chip>
          ))}
          {gapAnalysis.strengths?.map((factor) => (
            <Chip key={factor} variant="success">
              ↓ {formatFactorName(factor)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

GapAnalysisCard.propTypes = {
  result: PropTypes.object.isRequired,
  variant: PropTypes.oneOf(['default', 'transparent', 'assessment']),
};

export default GapAnalysisCard;
