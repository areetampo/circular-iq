import { Card, Chip } from '@heroui/react';

export default function SimilarCasesCard({ scoringResult }) {
  if (!scoringResult?.similar_cases || scoringResult.similar_cases.length === 0) return null;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Similar Cases</h3>
        <div className="space-y-4">
          {scoringResult.similar_cases.map((caseItem, index) => {
            const summary = scoringResult.audit?.similar_cases_summaries?.[index];
            const similarity = Math.round((caseItem.similarity || 0) * 100);
            return (
              <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {caseItem.title || `Case ${index + 1}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {caseItem.industry && (
                        <Chip variant="secondary" size="sm" className="text-xs">
                          {caseItem.industry}
                        </Chip>
                      )}
                      {caseItem.category && (
                        <Chip variant="secondary" size="sm" className="text-xs">
                          {caseItem.category}
                        </Chip>
                      )}
                    </div>
                  </div>
                  <Chip
                    variant="soft"
                    color={
                      similarity >= 80 ? 'success' : similarity >= 60 ? 'primary' : 'warning'
                    }
                    size="sm"
                    className="text-xs shrink-0"
                  >
                    {similarity}% match
                  </Chip>
                </div>
                {summary && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{summary}</p>
                )}

                {/* Problem preview */}
                {caseItem.problem && !summary && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    <span className="font-semibold">Problem: </span>
                    {caseItem.problem.substring(0, 200)}
                    {caseItem.problem.length > 200 ? '…' : ''}
                  </p>
                )}

                {/* Metadata chips */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {caseItem.circular_strategy && (
                    <Chip variant="soft" color="success" size="sm" className="text-xs">
                      {caseItem.circular_strategy}
                    </Chip>
                  )}
                  {caseItem.materials && (
                    <Chip variant="secondary" size="sm" className="text-xs">
                      {caseItem.materials}
                    </Chip>
                  )}
                </div>

                {/* Similarity bar */}
                <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      similarity >= 80
                        ? 'bg-emerald-500'
                        : similarity >= 60
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${similarity}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
