import { Card } from '@heroui/react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

export default function AuditSummaryCard({ scoringResult }) {
  if (!scoringResult?.audit) return null;
  const audit = scoringResult.audit;

  return (
    <Card
      className="border rounded-xl"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          AI Audit Summary
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Comprehensive analysis and recommendations
        </p>

        {audit.integrity_gaps && audit.integrity_gaps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Integrity Gaps
            </h4>
            <ul className="space-y-2">
              {audit.integrity_gaps.map((gap, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Chip
                    variant="default"
                    className="text-xs"
                    style={{
                      backgroundColor:
                        gap.severity === 'high'
                          ? 'var(--danger-soft)'
                          : gap.severity === 'medium'
                            ? 'var(--warning-soft)'
                            : 'var(--info-soft)',
                      color:
                        gap.severity === 'high'
                          ? 'var(--danger)'
                          : gap.severity === 'medium'
                            ? 'var(--warning)'
                            : 'var(--info)',
                    }}
                  >
                    {gap.severity || 'medium'}
                  </Chip>
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {gap.issue}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.strengths && audit.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Strengths
            </h4>
            <ul className="space-y-1">
              {audit.strengths.map((strength, i) => (
                <li key={i} className="text-sm" style={{ color: 'var(--muted)' }}>
                  • {strength.aspect || strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.technical_recommendations && audit.technical_recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Technical Recommendations
            </h4>
            <ul className="space-y-1">
              {audit.technical_recommendations.map((rec, i) => (
                <li key={i} className="text-sm" style={{ color: 'var(--muted)' }}>
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.similar_cases_summaries && audit.similar_cases_summaries.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Similar Cases Summaries
            </h4>
            <ul className="space-y-1">
              {audit.similar_cases_summaries.map((summary, i) => (
                <li key={i} className="text-sm" style={{ color: 'var(--muted)' }}>
                  • {summary}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audit.market_opportunity_summary && (
          <div
            className="mb-4 p-3 border-l-4 rounded-lg"
            style={{ backgroundColor: 'var(--info-soft)', borderLeftColor: 'var(--info)' }}
          >
            <h4
              className="text-xs font-bold mb-1 uppercase tracking-wide"
              style={{ color: 'var(--info)' }}
            >
              Market Opportunity
            </h4>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              {audit.market_opportunity_summary}
            </p>
          </div>
        )}

        {audit.improvement_roadmap && audit.improvement_roadmap.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              Improvement Roadmap
            </h4>
            <div className="space-y-3">
              {audit.improvement_roadmap.map((item, i) => (
                <div
                  key={i}
                  className="p-3 border rounded-lg flex gap-3"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor:
                        item.priority === 1 || item.priority === '1'
                          ? 'var(--danger-soft)'
                          : item.priority === 2 || item.priority === '2'
                            ? 'var(--warning-soft)'
                            : 'var(--info-soft)',
                      color:
                        item.priority === 1 || item.priority === '1'
                          ? 'var(--danger)'
                          : item.priority === 2 || item.priority === '2'
                            ? 'var(--warning)'
                            : 'var(--info)',
                    }}
                  >
                    {item.priority}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {item.action}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {item.target_factor && (
                        <Chip
                          variant="default"
                          className="text-xs"
                          style={{ color: 'var(--muted)' }}
                        >
                          {formatFactorName(item.target_factor)}
                        </Chip>
                      )}
                      {item.impact && (
                        <Chip
                          variant="default"
                          className="text-xs"
                          style={{
                            color:
                              item.impact === 'high'
                                ? 'var(--success)'
                                : item.impact === 'medium'
                                  ? 'var(--info)'
                                  : 'var(--muted)',
                          }}
                        >
                          {item.impact} impact
                        </Chip>
                      )}
                      {item.effort && (
                        <Chip
                          variant="default"
                          className="text-xs"
                          style={{
                            color:
                              item.effort === 'low'
                                ? 'var(--success)'
                                : item.effort === 'high'
                                  ? 'var(--danger)'
                                  : 'var(--warning)',
                          }}
                        >
                          {item.effort} effort
                        </Chip>
                      )}
                      {item.timeframe && (
                        <Chip
                          variant="default"
                          className="text-xs"
                          style={{ color: 'var(--subtle)' }}
                        >
                          {item.timeframe}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

AuditSummaryCard.propTypes = { scoringResult: PropTypes.object };
