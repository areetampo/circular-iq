import { Card } from '@heroui/react';

import { Chip } from '@/components/common';
import BenchmarkTable from '@/components/results/BenchmarkTable';
import { formatFactorName } from '@/lib/scoring';

export default function GapAnalysisCard({ scoringResult }) {
  if (!scoringResult?.gap_analysis?.has_benchmarks) return null;

  return (
    <Card
      className="border rounded-xl card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Gap Analysis
        </h3>
        <BenchmarkTable
          comparisons={scoringResult.gap_analysis.comparisons}
          opportunities={scoringResult.gap_analysis.opportunities}
          strengths={scoringResult.gap_analysis.strengths}
        />
        <div className="flex flex-wrap gap-2 mt-4">
          {scoringResult.gap_analysis.opportunities?.map((factor) => (
            <Chip key={factor} variant="warning">
              ↑ {formatFactorName(factor)}
            </Chip>
          ))}
          {scoringResult.gap_analysis.strengths?.map((factor) => (
            <Chip key={factor} variant="success">
              ✓ {formatFactorName(factor)}
            </Chip>
          ))}
        </div>
        {scoringResult.gap_analysis.message && (
          <p className="text-xs mt-3 italic" style={{ color: 'var(--muted)' }}>
            {scoringResult.gap_analysis.message}
          </p>
        )}
      </div>
    </Card>
  );
}
