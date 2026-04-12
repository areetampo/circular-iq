import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import { SectionHeading } from '@/components/common';
import BenchmarkTable from '@/components/results/BenchmarkTable';

export function GapAnalysisCard({ result, variant = 'default' }) {
  const gapAnalysis = result?.gap_analysis;
  if (!gapAnalysis?.has_benchmarks) return null;

  const isTransparent = variant === 'transparent';

  return (
    <div className="first:mt-0 first:border-0 first:pt-0">
      <SectionHeading
        variant="small"
        icon={<BarChart3 size={16} className="text-(--color-accent)" />}
      >
        Gap Analysis
      </SectionHeading>

      {isTransparent && (
        <p className="mb-6 text-sm/relaxed text-(--color-text-secondary)">{gapAnalysis.message}</p>
      )}

      <BenchmarkTable
        comparisons={gapAnalysis.comparisons}
        opportunities={gapAnalysis.opportunities}
        strengths={gapAnalysis.strengths}
      />

      {/* {(
        <div className="mt-6 flex flex-wrap gap-2">
          {gapAnalysis.opportunities?.map((factor) => (
            <Chip key={factor} variant="status" color="warning">
              ↑ {formatFactorName(factor)}
            </Chip>
          ))}
          {gapAnalysis.strengths?.map((factor) => (
            <Chip key={factor} variant="status" color="success">
              ↓ {formatFactorName(factor)}
            </Chip>
          ))}
        </div>
      )} */}
    </div>
  );
}

GapAnalysisCard.propTypes = {
  result: PropTypes.object.isRequired,
  variant: PropTypes.oneOf(['default', 'transparent', 'assessment']),
};

export default GapAnalysisCard;
