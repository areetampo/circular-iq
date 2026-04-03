import {
  ArrowRight,
  FileText,
  Lightbulb,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';
import { GapAnalysisCard } from '@/components/results/shared/GapAnalysisCard';
import { formatTimestamp, titleize } from '@/lib/formatting';

export function DetailsTab({ assessment1, assessment2, scoringResult1, scoringResult2 }) {
  return (
    <div className="space-y-8">
      {/* Full-width comparison sections */}
      <div className="space-y-8">
        {/* Project Details */}
        <div>
          <SectionHeading
            variant="small"
            icon={<FileText className="w-4 h-4 text-(--color-accent)" />}
          >
            Project Details
          </SectionHeading>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
            <span className="text-sm font-medium text-(--color-text-muted)">Industry</span>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult1?.metadata?.industry || assessment1.industry || '')}
            </Chip>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult2?.metadata?.industry || assessment2.industry || '')}
            </Chip>
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
            <span className="text-sm font-medium text-(--color-text-muted)">Scale</span>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult1?.metadata?.scale)}
            </Chip>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult2?.metadata?.scale)}
            </Chip>
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
            <span className="text-sm font-medium text-(--color-text-muted)">Strategy</span>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult1?.metadata?.r_strategy)}
            </Chip>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult2?.metadata?.r_strategy)}
            </Chip>
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
            <span className="text-sm font-medium text-(--color-text-muted)">Material</span>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult1?.metadata?.primary_material)}
            </Chip>
            <Chip variant="tag" className="text-xs">
              {titleize(scoringResult2?.metadata?.primary_material)}
            </Chip>
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
            <span className="text-sm font-medium text-(--color-text-muted)">Geography</span>
            <Chip variant="tag" className="text-xs">
              {titleize(
                scoringResult1?.metadata?.geographic_focus || assessment1.geographic_focus || '',
              )}
            </Chip>
            <Chip variant="tag" className="text-xs">
              {titleize(
                scoringResult2?.metadata?.geographic_focus || assessment2.geographic_focus || '',
              )}
            </Chip>
          </div>
        </div>

        {/* Gap Analysis Comparison */}
        <div className="border-t border-(--color-border) pt-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="border-r border-(--color-border) pr-8">
              <GapAnalysisCard result={scoringResult1} variant="transparent" />
            </div>
            <div className="pl-8">
              <GapAnalysisCard result={scoringResult2} variant="transparent" />
            </div>
          </div>
        </div>

        {/* Circular Economy Tier Comparison */}
        {(scoringResult1?.circular_economy_tier || scoringResult2?.circular_economy_tier) && (
          <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
            <SectionHeading
              variant="small"
              icon={<Target className="w-4 h-4 text-(--color-accent)" />}
            >
              Circular Economy Tier
            </SectionHeading>
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
          <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
            <SectionHeading
              variant="small"
              icon={<Target className="w-4 h-4 text-(--color-accent)" />}
            >
              R-Strategy Alignment
            </SectionHeading>
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
          <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
            <SectionHeading
              variant="small"
              icon={<Target className="w-4 h-4 text-(--color-accent)" />}
            >
              Self-Assessment Reliability
            </SectionHeading>
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
        <div className="border-t border-(--color-border) pt-8 mt-6 first:border-0 first:pt-0 first:mt-0">
          <SectionHeading
            variant="small"
            icon={<Lightbulb className="w-4 h-4 text-(--color-accent)" />}
          >
            Auditor&apos;s Verdict
          </SectionHeading>
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
        <div className="border-t border-(--color-border) pt-8 mt-6">
          <SectionHeading
            variant="small"
            icon={<Lightbulb className="w-4 h-4 text-(--color-accent)" />}
          >
            Summary
          </SectionHeading>
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
