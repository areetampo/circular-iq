import { Card, Chip } from '@heroui/react';
import PropTypes from 'prop-types';

import { formatFactorName } from '@/lib/scoring';

export function AuditSummaryCard({ actualResult }) {
  if (!actualResult?.audit) return null;

  return (
    <Card className="border border-slate-300 shadow-sm bg-white rounded-xl">
      <div className="p-1 sm:p-3">
        <h3 className="text-lg font-bold text-slate-900 mb-1">AI Audit Summary</h3>
        <p className="text-sm text-slate-600 mb-4">Comprehensive analysis and recommendations</p>

        {actualResult.audit.integrity_gaps && actualResult.audit.integrity_gaps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Integrity Gaps</h4>
            <ul className="space-y-2">
              {actualResult.audit.integrity_gaps.map((gap, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Chip
                    variant="soft"
                    className={`text-xs ${gap.severity === 'high' ? 'text-red-700 bg-red-100' : gap.severity === 'medium' ? 'text-amber-700 bg-amber-100' : 'text-blue-700 bg-blue-100'}`}
                  >
                    {gap.severity || 'medium'}
                  </Chip>
                  <span className="text-sm text-slate-700">{gap.issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actualResult.audit.strengths && actualResult.audit.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {actualResult.audit.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-slate-700">
                  • {strength.aspect}
                </li>
              ))}
            </ul>
          </div>
        )}

        {actualResult.audit.technical_recommendations &&
          actualResult.audit.technical_recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Technical Recommendations</h4>
              <ul className="space-y-1">
                {actualResult.audit.technical_recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-slate-700">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {actualResult.audit.improvement_roadmap &&
          actualResult.audit.improvement_roadmap.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Improvement Roadmap</h4>
              <div className="space-y-3">
                {actualResult.audit.improvement_roadmap.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex gap-3"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center
                                text-xs font-bold shrink-0 ${
                                  i === 0
                                    ? 'bg-red-100 text-red-700'
                                    : i === 1
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                    >
                      {item.priority}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{item.action}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {item.target_factor && (
                          <Chip
                            size="sm"
                            variant="soft"
                            className="text-xs text-slate-600 bg-slate-100"
                          >
                            {formatFactorName(item.target_factor)}
                          </Chip>
                        )}
                        <Chip
                          size="sm"
                          variant="soft"
                          className={`text-xs ${
                            item.impact === 'high'
                              ? 'text-green-700 bg-green-100'
                              : item.impact === 'medium'
                                ? 'text-blue-700 bg-blue-100'
                                : 'text-slate-600 bg-slate-100'
                          }`}
                        >
                          {item.impact} impact
                        </Chip>
                        <Chip
                          size="sm"
                          variant="soft"
                          className={`text-xs ${
                            item.effort === 'low'
                              ? 'text-green-700 bg-green-100'
                              : item.effort === 'high'
                                ? 'text-red-700 bg-red-100'
                                : 'text-amber-700 bg-amber-100'
                          }`}
                        >
                          {item.effort} effort
                        </Chip>
                        <Chip
                          size="sm"
                          variant="soft"
                          className="text-xs text-slate-500 bg-slate-50"
                        >
                          {item.timeframe}
                        </Chip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {actualResult.audit.sdg_alignment && actualResult.audit.sdg_alignment.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              UN Sustainable Development Goals
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actualResult.audit.sdg_alignment.map((sdg, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center
                                justify-center text-xs font-bold shrink-0"
                  >
                    {sdg.sdg_number}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{sdg.sdg_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{sdg.rationale}</div>
                    <Chip
                      size="sm"
                      variant="soft"
                      className={`text-xs mt-1 ${
                        sdg.relevance === 'high'
                          ? 'text-green-700 bg-green-100'
                          : sdg.relevance === 'medium'
                            ? 'text-blue-700 bg-blue-100'
                            : 'text-slate-500 bg-slate-100'
                      }`}
                    >
                      {sdg.relevance} relevance
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {actualResult.audit.market_opportunity_summary && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">
              Market Opportunity
            </h4>
            <p className="text-sm text-blue-900">{actualResult.audit.market_opportunity_summary}</p>
          </div>
        )}

        {actualResult.audit.similar_cases_summaries &&
          actualResult.audit.similar_cases_summaries.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Similar Cases Summaries</h4>
              <ul className="space-y-1">
                {actualResult.audit.similar_cases_summaries.map((summary, i) => (
                  <li key={i} className="text-sm text-slate-700">
                    • {summary}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {actualResult.audit.key_metrics_comparison && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Key Metrics Comparison</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(actualResult.audit.key_metrics_comparison).map(([key, value]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs font-bold text-slate-900 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-slate-700">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

AuditSummaryCard.propTypes = {
  actualResult: PropTypes.object,
};

export default AuditSummaryCard;
