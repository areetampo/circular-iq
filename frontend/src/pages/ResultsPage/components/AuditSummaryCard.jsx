import { Card, Chip } from '@heroui/react';
import PropTypes from 'prop-types';

import { formatFactorName } from '@/lib/scoring';

export function AuditSummaryCard({ actualResult }) {
  if (!actualResult?.audit) return null;

  return (
    <Card
      className="border rounded-xl card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-1 sm:p-3">
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          AI Audit Summary
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Comprehensive analysis and recommendations
        </p>

        {actualResult.audit.integrity_gaps && actualResult.audit.integrity_gaps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Integrity Gaps
            </h4>
            <ul className="space-y-2">
              {actualResult.audit.integrity_gaps.map((gap, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Chip
                    variant="soft"
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

        {actualResult.audit.strengths && actualResult.audit.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Strengths
            </h4>
            <ul className="space-y-1">
              {actualResult.audit.strengths.map((strength, i) => (
                <li key={i} className="text-sm" style={{ color: 'var(--foreground)' }}>
                  • {strength.aspect}
                </li>
              ))}
            </ul>
          </div>
        )}

        {actualResult.audit.technical_recommendations &&
          actualResult.audit.technical_recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Technical Recommendations
              </h4>
              <ul className="space-y-1">
                {actualResult.audit.technical_recommendations.map((rec, i) => (
                  <li key={i} className="text-sm" style={{ color: 'var(--foreground)' }}>
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {actualResult.audit.improvement_roadmap &&
          actualResult.audit.improvement_roadmap.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                Improvement Roadmap
              </h4>
              <div className="space-y-3">
                {actualResult.audit.improvement_roadmap.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg flex gap-3"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor:
                          i === 0
                            ? 'var(--danger-soft)'
                            : i === 1
                              ? 'var(--warning-soft)'
                              : 'var(--info-soft)',
                        color:
                          i === 0 ? 'var(--danger)' : i === 1 ? 'var(--warning)' : 'var(--info)',
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
                            size="sm"
                            variant="soft"
                            className="text-xs"
                            style={{
                              backgroundColor: 'var(--surface)',
                              color: 'var(--muted)',
                            }}
                          >
                            {formatFactorName(item.target_factor)}
                          </Chip>
                        )}
                        <Chip
                          size="sm"
                          variant="soft"
                          className="text-xs"
                          style={{
                            backgroundColor:
                              item.impact === 'high'
                                ? 'var(--success-soft)'
                                : item.impact === 'medium'
                                  ? 'var(--info-soft)'
                                  : 'var(--muted)',
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
                        <Chip
                          size="sm"
                          variant="soft"
                          className="text-xs"
                          style={{
                            backgroundColor:
                              item.effort === 'low'
                                ? 'var(--success-soft)'
                                : item.effort === 'high'
                                  ? 'var(--danger-soft)'
                                  : 'var(--warning-soft)',
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
                        <Chip
                          size="sm"
                          variant="soft"
                          className="text-xs"
                          style={{ backgroundColor: 'var(--subtle)', color: 'var(--subtle-fg)' }}
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
            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              UN Sustainable Development Goals
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actualResult.audit.sdg_alignment.map((sdg, i) => (
                <div
                  key={i}
                  className="p-3 border rounded-lg flex gap-2"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: 'var(--info)',
                      color: 'var(--surface)',
                    }}
                  >
                    {sdg.sdg_number}
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      {sdg.sdg_name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {sdg.rationale}
                    </div>
                    <Chip
                      size="sm"
                      variant="soft"
                      className="text-xs mt-1"
                      style={{
                        backgroundColor:
                          sdg.relevance === 'high'
                            ? 'var(--success-soft)'
                            : sdg.relevance === 'medium'
                              ? 'var(--info-soft)'
                              : 'var(--surface-raised)',
                        color:
                          sdg.relevance === 'high'
                            ? 'var(--success)'
                            : sdg.relevance === 'medium'
                              ? 'var(--info)'
                              : 'var(--subtle)',
                      }}
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
          <div
            className="mb-4 p-3 border rounded-lg"
            style={{ backgroundColor: 'var(--info-soft)', borderColor: 'var(--info)' }}
          >
            <h4
              className="text-xs font-bold mb-1 uppercase tracking-wide"
              style={{ color: 'var(--info)' }}
            >
              Market Opportunity
            </h4>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              {actualResult.audit.market_opportunity_summary}
            </p>
          </div>
        )}

        {actualResult.audit.similar_cases_summaries &&
          actualResult.audit.similar_cases_summaries.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Similar Cases Summaries
              </h4>
              <ul className="space-y-1">
                {actualResult.audit.similar_cases_summaries.map((summary, i) => (
                  <li key={i} className="text-sm" style={{ color: 'var(--foreground)' }}>
                    • {summary}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {actualResult.audit.key_metrics_comparison && (
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Key Metrics Comparison
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(actualResult.audit.key_metrics_comparison).map(([key, value]) => (
                <div
                  key={key}
                  className="p-3 border rounded-lg"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="text-xs font-bold capitalize"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {value}
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

AuditSummaryCard.propTypes = {
  actualResult: PropTypes.object,
};

export default AuditSummaryCard;
