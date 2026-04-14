import { BarChart3, MoveDown, MoveUp } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';
import BenchmarkTable from '@/components/results/BenchmarkTable';

export function GapAnalysisCard({ result, variant = 'default' }) {
  const gapAnalysis = result?.gap_analysis;
  if (!gapAnalysis?.has_benchmarks) return null;

  const isTransparent = variant === 'transparent';
  const { opportunities, strengths } = gapAnalysis;

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

      {(opportunities?.length > 0 || strengths?.length > 0) && (
        <div className="mt-8 flex flex-col gap-3">
          {opportunities?.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 pl-2 text-sm font-medium text-(--foreground)">
                Opportunities to Improve
              </div>
              <div className="flex flex-wrap gap-2">
                {opportunities.map((text) => (
                  <Chip key={text} variant="status" color="warning">
                    <MoveUp size={14} />
                    <span>{text}</span>
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {strengths?.length > 0 && (
            <div>
              <div className="mb-2 pl-2 text-sm font-medium text-(--foreground)">Strengths</div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((text) => (
                  <Chip key={text} variant="status" color="success">
                    <MoveDown size={14} />
                    <span>{text}</span>
                  </Chip>
                ))}
              </div>
            </div>
          )}
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
