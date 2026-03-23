import { Alert, Card } from '@heroui/react';
import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import BenchmarkTable from '@/components/results/BenchmarkTable';

export function GapAnalysisCard({ actualResult }) {
  if (!actualResult?.gap_analysis) return null;

  return actualResult.gap_analysis.has_benchmarks ? (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-1 sm:p-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
          <BarChart3 className="text-blue-600" size={20} /> Gap Analysis
        </h3>
        <p className="text-sm text-slate-600 mb-4">{actualResult.gap_analysis.message}</p>

        <BenchmarkTable
          comparisons={actualResult.gap_analysis.comparisons}
          opportunities={actualResult.gap_analysis.opportunities}
          strengths={actualResult.gap_analysis.strengths}
        />
      </div>
    </Card>
  ) : (
    <Alert severity="info" className="mb-6">
      {actualResult.gap_analysis.message || 'No benchmark data available.'}
    </Alert>
  );
}

GapAnalysisCard.propTypes = {
  actualResult: PropTypes.object,
};

export default GapAnalysisCard;
