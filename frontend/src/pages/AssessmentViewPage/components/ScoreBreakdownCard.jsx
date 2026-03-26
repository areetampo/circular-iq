import { Card, Chip } from '@heroui/react';

export default function ScoreBreakdownCard({ scoringResult }) {
  if (!scoringResult?.score_breakdown) return null;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(scoringResult.score_breakdown).map(([category, data]) => (
            <div key={category} className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-slate-900">{category}</div>
                <div className="text-sm font-bold text-slate-900">{data.score}</div>
              </div>
              <div className="text-xs text-slate-600 mb-2">{data.weight}</div>
              <p className="text-xs text-slate-700 mb-3">{data.description}</p>
              <div className="flex flex-wrap gap-1">
                {data.factors?.map((factor, i) => (
                  <Chip key={i} variant="secondary" size="sm" className="text-xs">
                    {factor.name}: {factor.score}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
