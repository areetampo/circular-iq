import { Card } from '@heroui/react';
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
    <Card
      className="border rounded-xl card-lift"
      style={{
        backgroundColor: isTransparent ? 'transparent' : 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className={isTransparent ? 'p-1 sm:p-3' : 'p-4'}>
        <h3
          className={`font-bold flex items-center gap-2 mb-1 ${isTransparent ? 'text-lg' : 'text-lg mb-4'}`}
          style={{ color: 'var(--foreground)' }}
        >
          {variant === 'transparent' && <BarChart3 style={{ color: 'var(--info)' }} size={20} />}{' '}
          Gap Analysis
        </h3>

        {variant === 'transparent' && (
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {gapAnalysis.message}
          </p>
        )}

        <BenchmarkTable
          comparisons={gapAnalysis.comparisons}
          opportunities={gapAnalysis.opportunities}
          strengths={gapAnalysis.strengths}
        />

        {variant === 'assessment' && (
          <div className="flex flex-wrap gap-2 mt-4">
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
    </Card>
  );
}

GapAnalysisCard.propTypes = {
  result: PropTypes.object.isRequired,
  variant: PropTypes.oneOf(['default', 'transparent', 'assessment']),
};

export default GapAnalysisCard;
