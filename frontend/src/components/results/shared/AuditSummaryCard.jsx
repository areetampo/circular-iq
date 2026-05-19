/**
 * @module AuditSummaryCard
 * @description Compact audit summary (tier, confidence, key metrics) for results and comparison views.
 */

import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';

/**
 * Compact audit summary (tier, confidence, key metrics) for results and comparison views.
 *
 * @param {Object} props
 * @param {Object} props.result
 * @param {string} props.variant
 * @returns {import('react').ReactElement}
 */
export default function AuditSummaryCard({ result, variant = 'default' }) {
  const audit = result?.audit;
  if (!audit) return null;

  return (
    <div>
      <SectionHeading
        variant="small"
        icon={
          <div className="flex size-5 items-center justify-center rounded-sm bg-(--color-accent-light) text-(--color-accent)">
            <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        }
      >
        AI Audit Summary
      </SectionHeading>

      <p className="-mt-3 mb-6 text-sm/relaxed text-(--color-text-secondary)">
        Comprehensive analysis and recommendations
      </p>

      {audit.integrity_gaps && audit.integrity_gaps.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-base font-medium text-(--color-text-primary)">Integrity Gaps</h4>
          <ul className="space-y-3">
            {audit.integrity_gaps.map((gap, i) => (
              <li key={i} className="flex items-center gap-3">
                <Chip variant="status" className="text-[0.625rem]">
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
          <h4 className="mb-3 text-base font-medium text-(--color-text-primary)">Strengths</h4>
          <ul className="space-y-2">
            {audit.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
                <span className="mt-1 text-(--color-accent)">•</span>
                {strength.aspect || strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.technical_recommendations && audit.technical_recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-base font-medium text-(--color-text-primary)">
            Technical Recommendations
          </h4>
          <ul className="space-y-2">
            {audit.technical_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
                <span className="mt-1 text-(--color-accent)">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.similar_cases_summaries && audit.similar_cases_summaries.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-base font-medium text-(--color-text-primary)">
            Similar Cases Summaries
          </h4>
          <ul className="space-y-2">
            {audit.similar_cases_summaries.map((summary, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
                <span className="mt-1 text-(--color-accent)">•</span>
                {summary}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit.market_opportunity_summary && (
        <div className="mb-6 border-l-2 border-(--color-accent) py-1 pl-3">
          <h4 className="mb-1 text-xs font-semibold tracking-wide uppercase">Market Opportunity</h4>
          <p className="text-sm/relaxed text-(--color-text-secondary)">
            {audit.market_opportunity_summary}
          </p>
        </div>
      )}

      {audit.improvement_roadmap && audit.improvement_roadmap.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-base font-medium text-(--color-text-primary)">
            Improvement Roadmap
          </h4>
          <div className="space-y-3">
            {audit.improvement_roadmap.map((item, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border-2 border-(--color-border-ui) p-3"
              >
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
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
                  <div className="text-sm font-medium text-(--color-text-primary)">
                    {item.title || item.step || `Step ${i + 1}`}
                  </div>
                  <div className="mb-1 text-sm text-(--color-text-secondary)">
                    {item.description || item.action}
                  </div>
                  {variant === 'transparent' && item.timeframe && (
                    <Chip size="sm">{item.timeframe}</Chip>
                  )}
                  {variant === 'assessment' && item.impact && (
                    <Chip
                      variant="status"
                      color={
                        item.impact === 'high'
                          ? 'success'
                          : item.impact === 'medium'
                            ? 'info'
                            : 'default'
                      }
                      className="text-xs"
                    >
                      {item.impact} impact
                    </Chip>
                  )}
                  {variant === 'assessment' && item.effort && (
                    <Chip
                      variant="status"
                      color={
                        item.effort === 'low'
                          ? 'success'
                          : item.effort === 'high'
                            ? 'danger'
                            : 'warning'
                      }
                      className="text-xs"
                    >
                      {item.effort} effort
                    </Chip>
                  )}
                  {variant === 'assessment' && item.timeframe && (
                    <Chip variant="info" className="text-xs">
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
          <h4 className="mb-3 text-base font-medium">UN Sustainable Development Goals</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {audit.sdg_alignment.map((sdg, i) => (
              <div
                key={i}
                className="flex gap-2 rounded-xl border-2 border-(--color-border-ui) bg-transparent p-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--color-info) font-medium text-(--color-bg)">
                  {sdg.sdg_number}
                </div>
                <div>
                  <div className="text-sm font-medium">{sdg.sdg_name}</div>
                  <div className="my-0.5 text-sm text-(--color-text-muted)">{sdg.rationale}</div>
                  <Chip
                    size="sm"
                    variant="status"
                    color={
                      sdg.relevance === 'high'
                        ? 'success'
                        : sdg.relevance === 'medium'
                          ? 'warning'
                          : 'danger'
                    }
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
          <h4 className="my-3 text-base font-medium text-(--color-text-primary)">
            Key Metrics Comparison
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Object.entries(audit.key_metrics_comparison).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border-2 border-(--color-border-ui) bg-transparent px-2.5 py-1.5"
              >
                <div className="font-medium text-(--color-text-primary) capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-(--color-text-primary)/75">{value}</div>
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
