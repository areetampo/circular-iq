import {
  ArrowRight,
  Award,
  FileText,
  Lightbulb,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { formatTimestamp, titleize } from '@/lib/formatting';
import { formatFactorName } from '@/lib/scoring';

export function DetailsTab({ assessment1, assessment2, scoringResult1, scoringResult2 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
      <div className="border-r border-(--color-border) pr-8">
        {/* Project Details */}
        <div className="border-t border-(--color-border) pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
          <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4 flex items-center gap-2">
            <FileText size={14} />
            Project Details
          </p>
          <div className="space-y-2">
            {[
              {
                label: 'Industry',
                value1: titleize(scoringResult1?.metadata?.industry || assessment1.industry || ''),
                value2: titleize(scoringResult2?.metadata?.industry || assessment2.industry || ''),
              },
              {
                label: 'Scale',
                value1: titleize(scoringResult1?.metadata?.scale),
                value2: titleize(scoringResult2?.metadata?.scale),
              },
              {
                label: 'Strategy',
                value1: titleize(scoringResult1?.metadata?.r_strategy),
                value2: titleize(scoringResult2?.metadata?.r_strategy),
              },
              {
                label: 'Material',
                value1: titleize(scoringResult1?.metadata?.primary_material),
                value2: titleize(scoringResult2?.metadata?.primary_material),
              },
            ].map(({ label, value1, value2 }) => (
              <div
                key={label}
                className="flex justify-between items-start py-2 border-b border-(--color-border) last:border-0 text-sm gap-4"
              >
                <span className="text-(--color-text-muted) shrink-0">{label}</span>
                <div className="flex gap-2 items-center flex-1 justify-end">
                  <Chip variant="default" size="sm" className="transition-all duration-200">
                    {value1}
                  </Chip>
                  <span className="text-(--color-text-muted)">vs</span>
                  <Chip variant="default" size="sm" className="transition-all duration-200">
                    {value2}
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gap Analysis Comparison */}
        {(scoringResult1?.gap_analysis?.has_benchmarks ||
          scoringResult2?.gap_analysis?.has_benchmarks) && (
          <div className="border-t border-(--color-border) pt-6 mt-6">
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4 flex items-center gap-2">
              <Award size={14} />
              Gap Analysis vs Similar Projects
            </p>
            <div className="space-y-2">
              {Object.keys(scoringResult1?.sub_scores || scoringResult2?.sub_scores || {}).map(
                (factor) => {
                  const comp1 = scoringResult1?.gap_analysis?.comparisons?.[factor];
                  const comp2 = scoringResult2?.gap_analysis?.comparisons?.[factor];
                  const getStatusColor = (s) =>
                    s === 'above_average'
                      ? 'text-(--color-success)'
                      : s === 'below_average'
                        ? 'text-(--color-danger)'
                        : 'text-(--color-info)';
                  return (
                    <div
                      key={factor}
                      className="flex justify-between items-start py-2 border-b border-(--color-border) last:border-0 text-sm gap-4"
                    >
                      <span className="text-(--color-text-muted) shrink-0">
                        {formatFactorName(factor)}
                      </span>
                      <div className="flex gap-4 items-center flex-1 justify-end">
                        {comp1 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold text-(--color-text-primary)">
                              {comp1.userScore}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getStatusColor(comp1.status)}`}
                            >
                              {comp1.status?.replace(/_/g, ' ') || '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-(--color-text-muted)">—</span>
                        )}
                        {comp2 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold text-(--color-text-primary)">
                              {comp2.userScore}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getStatusColor(comp2.status)}`}
                            >
                              {comp2.status?.replace(/_/g, ' ') || '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-(--color-text-muted)">—</span>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* Circular Economy Tier Comparison */}
        {(scoringResult1?.circular_economy_tier || scoringResult2?.circular_economy_tier) && (
          <div className="border-t border-(--color-border) pt-6 mt-6">
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">
              Circular Economy Tier
            </p>
            <div className="space-y-4">
              {[
                { sr: scoringResult1, title: assessment1.title },
                { sr: scoringResult2, title: assessment2.title },
              ].map(({ sr, title }) => {
                const tier = sr?.circular_economy_tier;
                if (!tier)
                  return (
                    <div
                      key={title}
                      className="border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0 text-sm text-(--color-text-muted)"
                    >
                      No tier data
                    </div>
                  );
                const tierColor =
                  tier.badge_color === 'green'
                    ? 'text-(--color-success)'
                    : tier.badge_color === 'blue'
                      ? 'text-(--color-info)'
                      : tier.badge_color === 'amber'
                        ? 'text-(--color-warning)'
                        : 'text-(--color-danger)';
                const tierBg =
                  tier.badge_color === 'green'
                    ? 'bg-(--color-success-soft)'
                    : tier.badge_color === 'blue'
                      ? 'bg-(--color-info-soft)'
                      : tier.badge_color === 'amber'
                        ? 'bg-(--color-warning-soft)'
                        : 'bg-(--color-danger-soft)';
                return (
                  <div
                    key={title}
                    className={`border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0 ${tierBg}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-(--color-text-muted)">
                      {title}
                    </p>
                    <p className={`text-2xl font-bold ${tierColor}`}>{tier.tier}</p>
                    <p className="text-xs mb-2 text-(--color-text-muted)">
                      {tier.range} · {tier.percentile_estimate}
                    </p>
                    <p className="text-xs leading-relaxed text-(--color-text-muted)">
                      {tier.next_milestone}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* R-Strategy Alignment Comparison */}
        {(scoringResult1?.r_strategy_alignment?.alignment_score != null ||
          scoringResult2?.r_strategy_alignment?.alignment_score != null) && (
          <div className="border-t border-(--color-border) pt-6 mt-6">
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">
              R-Strategy Alignment
            </p>
            <div className="space-y-4">
              {[
                { sr: scoringResult1, title: assessment1.title },
                { sr: scoringResult2, title: assessment2.title },
              ].map(({ sr, title }) => {
                const ra = sr?.r_strategy_alignment;
                if (!ra?.alignment_score)
                  return (
                    <div
                      key={title}
                      className="border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0 text-sm text-(--color-text-muted)"
                    >
                      No alignment data
                    </div>
                  );
                const scoreColor =
                  ra.alignment_score >= 75
                    ? 'text-(--color-success)'
                    : ra.alignment_score >= 55
                      ? 'text-(--color-info)'
                      : 'text-(--color-warning)';
                return (
                  <div
                    key={title}
                    className="border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-(--color-text-muted)">
                      {title}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-2xl font-bold ${scoreColor}`}>
                        {ra.alignment_score}
                      </span>
                      <span className="text-sm text-(--color-text-muted)">/100</span>
                    </div>
                    <p className="text-xs mb-1 text-(--color-text-muted)">{ra.rating}</p>
                    <p className="text-xs leading-relaxed text-(--color-text-muted)">
                      {ra.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Parameter Consistency Comparison */}
        {(scoringResult1?.parameter_consistency || scoringResult2?.parameter_consistency) && (
          <div className="border-t border-(--color-border) pt-6 mt-6">
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">
              Self-Assessment Reliability
            </p>
            <div className="space-y-4">
              {[
                { sr: scoringResult1, title: assessment1.title },
                { sr: scoringResult2, title: assessment2.title },
              ].map(({ sr, title }) => {
                const pc = sr?.parameter_consistency;
                if (!pc)
                  return (
                    <div
                      key={title}
                      className="border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0 text-sm text-(--color-text-muted)"
                    >
                      No data
                    </div>
                  );
                const scoreColor =
                  pc.score >= 85
                    ? 'text-(--color-success)'
                    : pc.score >= 65
                      ? 'text-(--color-info)'
                      : 'text-(--color-warning)';
                return (
                  <div
                    key={title}
                    className="border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-(--color-text-muted)">
                      {title}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-2xl font-bold ${scoreColor}`}>{pc.score}</span>
                      <span className="text-sm text-(--color-text-muted)">/100</span>
                    </div>
                    <p className="text-xs mb-1 text-(--color-text-muted)">
                      {pc.rating} Consistency
                    </p>
                    <p className="text-xs leading-relaxed text-(--color-text-muted)">
                      {pc.interpretation}
                    </p>
                    {pc.issues?.length > 0 && (
                      <p className="text-xs mt-1 text-(--color-warning)">
                        {pc.issues_found} issue{pc.issues_found !== 1 ? 's' : ''} detected
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pl-8">
        {/* Auditor's Verdict */}
        <div className="border-t border-(--color-border) pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
          <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4 flex items-center gap-2">
            <Lightbulb size={14} />
            Auditor&apos;s Verdict
          </p>
          <div className="space-y-4">
            <div className="p-5 pl-4 border-l-4 rounded-r-lg border-(--color-success) bg-(--color-success-soft)">
              <p className="text-sm font-bold uppercase mb-2 tracking-wide text-(--color-success)">
                {assessment1.title}
              </p>
              <p className="text-sm leading-relaxed text-(--color-text-muted)">
                {scoringResult1?.audit?.audit_verdict || 'No verdict available'}
              </p>
            </div>

            <div className="p-5 pl-4 border-l-4 rounded-r-lg border-(--color-info) bg-(--color-info-soft)">
              <p className="text-sm font-bold uppercase mb-2 tracking-wide text-(--color-info)">
                {assessment2.title}
              </p>
              <p className="text-sm leading-relaxed text-(--color-text-muted)">
                {scoringResult2?.audit?.audit_verdict || 'No verdict available'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-(--color-border) pt-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-(--color-accent-light)">
              <Lightbulb className="text-(--color-accent)" size={20} />
            </div>
            <h3 className="text-xl font-bold text-(--color-text-primary)">Summary</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <strong className="text-(--color-text-primary)">Score Trend:</strong>
              {scoringResult2?.overall_score > scoringResult1?.overall_score ? (
                <Chip
                  color="success"
                  variant="soft"
                  size="sm"
                  className="transition-all duration-200"
                >
                  <TrendingUp size={12} />
                  Score improved
                </Chip>
              ) : scoringResult2?.overall_score < scoringResult1?.overall_score ? (
                <Chip
                  color="danger"
                  variant="soft"
                  size="sm"
                  className="transition-all duration-200"
                >
                  <TrendingDown size={12} />
                  Score declined
                </Chip>
              ) : (
                <Chip
                  color="default"
                  variant="soft"
                  size="sm"
                  className="transition-all duration-200"
                >
                  <Minus size={12} />
                  Score unchanged
                </Chip>
              )}
            </div>

            {(function () {
              const a1 = scoringResult1?.metadata?.industry || assessment1.industry || '';
              const a2 = scoringResult2?.metadata?.industry || assessment2.industry || '';
              if (a1 && a2 && a1 !== a2) {
                return (
                  <div className="flex items-center gap-2">
                    <strong className="text-(--color-text-primary)">Industry Change:</strong>
                    <span className="flex items-center gap-1 font-medium text-(--color-text-muted)">
                      {titleize(a1)}
                      <ArrowRight size={12} />
                      {titleize(a2)}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="pt-2 border-t border-(--color-border)">
              <strong className="text-(--color-text-primary)">Compared: </strong>
              <span className="text-md font-bold text-(--color-text-primary)">
                {assessment1.title}
                <span className="italic font-normal">
                  {' '}
                  ({formatTimestamp(assessment1.created_at)}) vs.{' '}
                </span>
                {assessment2.title}
                <span className="italic font-normal">
                  {' '}
                  ({formatTimestamp(assessment2.created_at)})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

DetailsTab.propTypes = {
  /** First assessment object with title, industry, created_at, etc. */
  assessment1: PropTypes.object.isRequired,
  /** Second assessment object with title, industry, created_at, etc. */
  assessment2: PropTypes.object.isRequired,
  /** First assessment's calculated scoring result */
  scoringResult1: PropTypes.object.isRequired,
  /** Second assessment's calculated scoring result */
  scoringResult2: PropTypes.object.isRequired,
};

export default DetailsTab;
