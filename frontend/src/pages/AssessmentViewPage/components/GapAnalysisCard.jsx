import { Card, Chip } from '@heroui/react';

import BenchmarkTable from '@/components/results/BenchmarkTable';
import { formatFactorName } from '@/lib/scoring';

export default function GapAnalysisCard({ scoringResult }) {
  if (!scoringResult?.gap_analysis?.has_benchmarks) return null;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Gap Analysis</h3>
        <BenchmarkTable
          comparisons={scoringResult.gap_analysis.comparisons}
          opportunities={scoringResult.gap_analysis.opportunities}
          strengths={scoringResult.gap_analysis.strengths}
        />
        <div className="flex flex-wrap gap-2 mt-4">
          {scoringResult.gap_analysis.opportunities?.map((factor) => (
            <Chip key={factor} variant="soft" color="warning" size="sm">
              ↑ {formatFactorName(factor)}
            </Chip>
          ))}
          {scoringResult.gap_analysis.strengths?.map((factor) => (
            <Chip key={factor} variant="soft" color="success" size="sm">
              ✓ {formatFactorName(factor)}
            </Chip>
          ))}
        </div>
        {scoringResult.gap_analysis.message && (
          <p className="text-xs text-slate-500 mt-3 italic">
            {scoringResult.gap_analysis.message}
          </p>
        )}
      </div>
    </Card>
  );
}
