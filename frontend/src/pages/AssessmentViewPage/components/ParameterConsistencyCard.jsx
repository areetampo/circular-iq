import { Card, Chip } from '@heroui/react';

import { formatFactorName } from '@/lib/scoring';

export default function ParameterConsistencyCard({ scoringResult }) {
  if (!scoringResult?.parameter_consistency) return null;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Self-Assessment Reliability</h3>
            <p className="text-sm text-slate-500">
              Internal consistency of your 8 parameter scores
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-bold ${
                scoringResult.parameter_consistency.score >= 85
                  ? 'text-green-600'
                  : scoringResult.parameter_consistency.score >= 65
                    ? 'text-blue-600'
                    : scoringResult.parameter_consistency.score >= 40
                      ? 'text-amber-600'
                      : 'text-red-600'
              }`}
            >
              {scoringResult.parameter_consistency.score}
              <span className="text-sm text-slate-400">/100</span>
            </div>
            <div className="text-xs text-slate-500">
              {scoringResult.parameter_consistency.rating} Consistency
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          {scoringResult.parameter_consistency.interpretation}
        </p>
        {scoringResult.parameter_consistency.issues?.length > 0 && (
          <div className="space-y-2">
            {scoringResult.parameter_consistency.issues.map((issue, i) => (
              <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">{issue.issue}</p>
                <div className="flex gap-1 mt-1">
                  {issue.factors?.map((f) => (
                    <Chip
                      key={f}
                      size="sm"
                      variant="soft"
                      className="text-xs text-amber-700 bg-amber-100"
                    >
                      {formatFactorName(f)}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
