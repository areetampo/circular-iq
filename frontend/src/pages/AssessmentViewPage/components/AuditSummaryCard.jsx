import { Card, Chip } from '@heroui/react';

export default function AuditSummaryCard({ scoringResult }) {
  if (!scoringResult?.audit) return null;

  const { audit } = scoringResult;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-1 sm:p-3">
        <h3 className="text-lg font-bold text-slate-900 mb-1">AI Audit Summary</h3>
        <p className="text-sm text-slate-600 mb-4">Comprehensive analysis and recommendations</p>

        {/* Integrity Gaps */}
        {audit.integrity_gaps && audit.integrity_gaps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Integrity Gaps</h4>
            <ul className="space-y-2">
              {audit.integrity_gaps.map((gap, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Chip
                    variant="soft"
                    className={`text-xs ${
                      gap.severity === 'high'
                        ? 'text-red-700 bg-red-100'
                        : gap.severity === 'medium'
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-blue-700 bg-blue-100'
                    }`}
                  >
                    {gap.severity || 'medium'}
                  </Chip>
                  <span className="text-sm text-slate-700">{gap.issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths */}
        {audit.strengths && audit.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {audit.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-slate-700">
                  • {strength.aspect}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Recommendations */}
        {audit.technical_recommendations && audit.technical_recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Technical Recommendations</h4>
            <ul className="space-y-1">
              {audit.technical_recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-slate-700">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Similar Cases Summaries */}
        {audit.similar_cases_summaries && audit.similar_cases_summaries.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Similar Cases Summaries</h4>
            <ul className="space-y-1">
              {audit.similar_cases_summaries.map((summary, i) => (
                <li key={i} className="text-sm text-slate-700">
                  • {summary}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market Opportunity */}
        {audit.market_opportunity_summary && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">
              Market Opportunity
            </h4>
            <p className="text-sm text-blue-900">{audit.market_opportunity_summary}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
