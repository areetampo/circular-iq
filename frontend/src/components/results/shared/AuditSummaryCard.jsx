import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export function AuditSummaryCard({ result, variant = 'default' }) {
  const audit = result?.audit;
  if (!audit) return null;

  const isTransparent = variant === 'transparent';

  return (
    <div className="border-t border-(--color-border) pt-8 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-(--color-accent-light) rounded-sm flex items-center justify-center text-(--color-accent)">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted)">
          AI Audit Summary
        </h3>
      </div>

      <p className="text-sm text-(--color-text-secondary) mb-6 leading-relaxed">
        Comprehensive analysis and recommendations
      </p>

      {audit.integrity_gaps && audit.integrity_gaps.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-(--color-text-primary)">Integrity Gaps</h4>
          <ul className="space-y-3">
            {audit.integrity_gaps.map((gap, i) => (
              <li key={i} className="flex items-center gap-3">
                <Chip variant="status" className="text-[10px]">
                  {gap.severity || 'medium'}
                </Chip>
                <span className="text-sm text-(--color-text-secondary)">{gap.issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.strengths && audit.strengths.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-(--color-text-primary)">Strengths</h4>
          <ul className="space-y-2">
            {audit.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-(--color-text-secondary) flex items-start gap-2">
                <span className="text-(--color-accent) mt-1">•</span>
                {strength.aspect || strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.technical_recommendations && audit.technical_recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
            Technical Recommendations
          </h4>
          <ul className="space-y-2">
            {audit.technical_recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-(--color-text-secondary) flex items-start gap-2">
                <span className="text-(--color-accent) mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.similar_cases_summaries && audit.similar_cases_summaries.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
            Similar Cases Summaries
          </h4>
          <ul className="space-y-2">
            {audit.similar_cases_summaries.map((summary, i) => (
              <li key={i} className="text-sm text-(--color-text-secondary) flex items-start gap-2">
                <span className="text-(--color-accent) mt-1">•</span>
                {summary}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.market_opportunity_summary && (
        <div className="border-l-2 border-(--color-accent) pl-3 py-1 mb-6">
          <h4 className="text-xs font-semibold uppercase mb-1 text-(--color-accent)">
            Market Opportunity
          </h4>
          <p className="text-sm text-(--color-text-secondary) leading-relaxed">
            {audit.market_opportunity_summary}
          </p>
        </div>
      )}

      {audit.improvement_roadmap && audit.improvement_roadmap.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
            Improvement Roadmap
          </h4>
          <div className="space-y-3">
            {audit.improvement_roadmap.map((item, i) => (
              <div key={i} className="p-3 border border-(--color-border) rounded-md flex gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 || item.priority === 1 || item.priority === '1'
                      ? 'bg-(--color-error) text-white'
                      : i === 1 || item.priority === 2 || item.priority === '2'
                        ? 'bg-(--color-warning) text-white'
                        : 'bg-(--color-accent) text-white'
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-(--color-text-primary) mb-1">
                    {item.title || item.step || `Step ${i + 1}`}
                  </div>
                  <div className="text-sm text-(--color-text-secondary)">
                    {item.description || item.action}
                  </div>
                  {variant === 'transparent' && item.timeframe && (
                    <Chip
                      size="sm"
                      variant="soft"
                      className="text-xs bg-(--color-bg-field) text-(--color-text-muted)"
                    >
                      {item.timeframe}
                    </Chip>
                  )}
                  {variant === 'assessment' && item.impact && (
                    <Chip
                      variant="default"
                      className="text-xs"
                      style={{
                        color:
                          item.impact === 'high'
                            ? 'text-(--color-success)'
                            : item.impact === 'medium'
                              ? 'text-(--color-info)'
                              : 'text-(--color-text-muted)',
                      }}
                    >
                      {item.impact} impact
                    </Chip>
                  )}
                  {variant === 'assessment' && item.effort && (
                    <Chip
                      variant="default"
                      className="text-xs"
                      style={{
                        color:
                          item.effort === 'low'
                            ? 'text-(--color-success)'
                            : item.effort === 'high'
                              ? 'text-(--color-error)'
                              : 'text-(--color-warning)',
                      }}
                    >
                      {item.effort} effort
                    </Chip>
                  )}
                  {variant === 'assessment' && item.timeframe && (
                    <Chip variant="default" className="text-xs text-(--color-text-muted)">
                      {item.timeframe}
                    </Chip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 'transparent' && audit.sdg_alignment && audit.sdg_alignment.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold mb-3 text-(--color-text-primary)">
            UN Sustainable Development Goals
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {audit.sdg_alignment.map((sdg, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg flex gap-2 border-(--color-border) bg-transparent"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-(--color-info) text-(--color-bg)">
                  {sdg.sdg_number}
                </div>
                <div>
                  <div className="text-xs font-semibold text-(--color-text-primary)">
                    {sdg.sdg_name}
                  </div>
                  <div className="text-xs mt-0.5 text-(--color-text-muted)">{sdg.rationale}</div>
                  <Chip
                    size="sm"
                    variant="soft"
                    className="text-xs mt-1 bg-(--color-success-light) text-(--color-success)"
                  >
                    {sdg.relevance} relevance
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 'transparent' && audit.key_metrics_comparison && (
        <div className="mb-4">
          <h4 className="text-sm font-bold mb-2 text-(--color-text-primary)">
            Key Metrics Comparison
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(audit.key_metrics_comparison).map(([key, value]) => (
              <div
                key={key}
                className="p-3 border rounded-lg bg-transparent border-(--color-border)"
              >
                <div className="text-xs font-bold capitalize text-(--color-text-primary)">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-(--color-text-primary)">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

AuditSummaryCard.propTypes = {
  result: PropTypes.object.isRequired,
  variant: PropTypes.oneOf(['default', 'transparent', 'assessment']),
};

export default AuditSummaryCard;
