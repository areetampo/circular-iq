import {
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  Lightbulb,
  Search,
  TrendingUp,
  Zap,
} from 'lucide-react';
import PropTypes from 'prop-types';

import BarChart from '@/components/charts/BarChart';
import RadarChart from '@/components/charts/RadarChart';
import { Chip, SectionHeading } from '@/components/common';
import { AuditSummaryCard } from '@/components/results/shared';
import { categoryMapping, validKeys } from '@/constants/evaluationData';
import { titleize } from '@/lib/formatting';
import { categorizeIntegrityGaps } from '@/utils/content';

import { ChangeIndicator } from './ChangeIndicator';

export function FactorAnalysisTab({
  assessment1,
  assessment2,
  scoringResult1,
  scoringResult2,
  factorDiffs,
  radarChartData,
  radarConfigs,
  barChartData,
  barConfigs,
  getScoreColor,
}) {
  return (
    <>
      {/* Visual Comparison Charts */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <SectionHeading
          variant="small"
          icon={<GitCompare className="w-4 h-4 text-(--color-accent)" />}
        >
          Visual Comparison
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="border-r border-(--color-border) pr-8">
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3">
              Factor Comparison (Radar)
            </p>
            <div className="h-100 p-4 rounded-lg border border-(--color-border)">
              {radarChartData && radarConfigs ? (
                <RadarChart
                  data={radarChartData}
                  radarConfigs={radarConfigs}
                  height={400}
                  showLegend
                  showTooltip
                />
              ) : (
                <div className="h-full flex items-center justify-center text-(--color-text-muted)">
                  Loading chart data...
                </div>
              )}
            </div>
          </div>
          <div className="pl-8">
            <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3">
              Score Comparison (Bar)
            </p>
            <div className="h-100 p-4 rounded-lg border border-(--color-border)">
              {barChartData && barConfigs ? (
                <BarChart
                  data={barChartData}
                  barConfigs={barConfigs}
                  height={400}
                  showLegend
                  showGrid
                  yAxisLabel="Score"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-(--color-text-muted)">
                  Loading chart data...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Factor Progress */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <SectionHeading variant="small" icon={<Zap className="w-4 h-4 text-(--color-accent)" />}>
          Detailed Factor Analysis
        </SectionHeading>

        {factorDiffs?.length > 0 ? (
          <div className="space-y-0">
            {factorDiffs.map((factor) => (
              <div
                key={factor.factor}
                className="flex items-center gap-3 py-2.5 border-b border-(--color-border) last:border-0"
              >
                <span className="text-xs text-(--color-text-muted) w-36 shrink-0 truncate">
                  {factor.label}
                </span>
                <div className="flex-1 bg-(--color-border) h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rgba(180,160,130,0.4) rounded-full"
                    style={{ width: `${factor.a1}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-(--color-text-primary) w-8 text-right shrink-0">
                  {factor.a1}
                </span>
                <span className="shrink-0">
                  <ChangeIndicator diff={factor.diff} />
                </span>
                <div className="flex-1 bg-(--color-border) h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-(--color-accent) rounded-full"
                    style={{ width: `${factor.a2}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-(--color-text-primary) w-8 text-right shrink-0">
                  {factor.a2}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-(--color-text-muted)">
            No factor analysis data available
          </div>
        )}
      </div>

      {/* Score Contribution Breakdown (Weighted Score Card) */}
      {(scoringResult1?.weighted_score_card || scoringResult2?.weighted_score_card) && (
        <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
          <SectionHeading
            variant="small"
            icon={<TrendingUp className="w-4 h-4 text-(--color-accent)" />}
          >
            Score Contribution Breakdown
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {[
              { sr: scoringResult1, assessment: assessment1 },
              { sr: scoringResult2, assessment: assessment2 },
            ].map(({ sr, assessment }) => {
              const weightedCard = sr?.weighted_score_card;
              if (!weightedCard || !Array.isArray(weightedCard)) return null;

              return (
                <div
                  key={assessment.id}
                  className={
                    sr === scoringResult1 ? 'border-r border-(--color-border) pr-8' : 'pl-8'
                  }
                >
                  <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">
                    {assessment.title}
                  </p>

                  <div className="space-y-3">
                    {weightedCard
                      .sort((a, b) => b.contribution - a.contribution)
                      .map((item, index) => (
                        <div
                          key={item.factor}
                          className="flex items-center gap-3 py-2 border-b border-(--color-border) last:border-0"
                        >
                          <div className="w-36 text-xs font-medium truncate shrink-0 text-(--color-text-muted)">
                            {titleize(item.factor)}
                          </div>
                          <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border)">
                            <div
                              className="h-1.5 rounded-full bg-(--color-accent)"
                              style={{ width: `${item.contribution}%` }}
                            />
                          </div>
                          <div className="text-xs w-8 text-right shrink-0 font-mono text-(--color-text-primary)">
                            {item.contribution}
                          </div>
                        </div>
                      ))}

                    {weightedCard.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-(--color-border)">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-(--color-text-muted)">Top Contributor:</span>
                          <span className="font-medium text-(--color-text-primary)">
                            {titleize(weightedCard[0]?.factor)} ({weightedCard[0]?.contribution}%)
                          </span>
                        </div>
                        {weightedCard.length > 1 && (
                          <div className="flex justify-between items-center text-xs mt-1">
                            <span className="text-(--color-text-muted)">Bottom Contributor:</span>
                            <span className="font-medium text-(--color-text-primary)">
                              {titleize(weightedCard[weightedCard.length - 1]?.factor)} (
                              {weightedCard[weightedCard.length - 1]?.contribution}%)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Analysis with Descriptions */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <SectionHeading variant="small" icon={<Search className="w-4 h-4 text-(--color-accent)" />}>
          Category Analysis
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {[
            { sr: scoringResult1, assessment: assessment1 },
            { sr: scoringResult2, assessment: assessment2 },
          ].map(({ sr, assessment }) => {
            const subScores = sr?.sub_scores || {};

            // Compute business viability score
            const computeBusinessViabilityScore = (res) => {
              if (!res) return 0;
              const confidence = res.audit?.confidence_score;
              const normalizedConfidence = confidence ? (confidence / 100) * 100 : 50;
              return Math.round(
                (Number(res.overall_score) || 0) * 0.7 + normalizedConfidence * 0.3,
              );
            };

            const businessViabilityScore = computeBusinessViabilityScore(sr);

            return (
              <div
                key={assessment.id}
                className={sr === scoringResult1 ? 'border-r border-(--color-border) pr-8' : 'pl-8'}
              >
                <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">
                  {assessment.title}
                </p>

                <div className="space-y-4">
                  {validKeys.map((factor) => {
                    const score = subScores[factor] || 0;
                    const categoryInfo = categoryMapping[factor];

                    return (
                      <div key={factor} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-(--color-text-primary)">
                              {categoryInfo?.name || titleize(factor)}
                            </p>
                            <p className="text-xs text-(--color-text-muted) leading-relaxed mt-1">
                              {categoryInfo?.desc}
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            <Chip
                              variant="match"
                              color={score >= 75 ? 'strong' : score >= 50 ? 'decent' : 'weak'}
                              className="text-xs font-mono"
                            >
                              {score}
                            </Chip>
                          </div>
                        </div>
                        <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border)">
                          <div
                            className="h-1.5 rounded-full bg-(--color-accent)"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Business Viability Score */}
                  <div className="pt-4 border-t border-(--color-border)">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-(--color-text-primary)">
                          Business Viability
                        </p>
                        <p className="text-xs text-(--color-text-muted) leading-relaxed mt-1">
                          Combined score of overall performance and confidence
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <Chip
                          variant="match"
                          color={
                            businessViabilityScore >= 75
                              ? 'strong'
                              : businessViabilityScore >= 50
                                ? 'decent'
                                : 'weak'
                          }
                          className="text-xs font-mono"
                        >
                          {businessViabilityScore}
                        </Chip>
                      </div>
                    </div>
                    <div className="flex-1 rounded-full h-1.5 relative overflow-hidden bg-(--color-border) mt-2">
                      <div
                        className="h-1.5 rounded-full bg-(--color-success)"
                        style={{ width: `${businessViabilityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Factor-by-Factor Table */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <SectionHeading variant="small" icon={<Search className="w-4 h-4 text-(--color-accent)" />}>
          Factor-by-Factor Comparison
        </SectionHeading>

        <div className="space-y-0">
          {Object.entries(scoringResult1?.sub_scores || {}).map(([factor, val1]) => {
            const val2 = scoringResult2?.sub_scores?.[factor] || 0;
            const diff = val2 - val1;
            return (
              <div
                key={factor}
                className="flex items-center gap-4 py-2.5 border-b border-(--color-border) last:border-0 text-sm"
              >
                <span className="text-(--color-text-muted) w-1/3 font-medium">
                  {titleize(factor)}
                </span>
                <div className="flex items-center gap-3 w-1/3">
                  <Chip
                    variant="tag"
                    className={`text-xs ${getScoreColor(val1) === 'var(--color-success)' ? 'text-(--color-success)' : getScoreColor(val1) === 'var(--color-warning)' ? 'text-(--color-warning)' : 'text-(--color-error)'}`}
                  >
                    {val1}
                  </Chip>
                  <Chip
                    variant="tag"
                    className={`text-xs ${getScoreColor(val2) === 'var(--color-success)' ? 'text-(--color-success)' : getScoreColor(val2) === 'var(--color-warning)' ? 'text-(--color-warning)' : 'text-(--color-error)'}`}
                  >
                    {val2}
                  </Chip>
                </div>
                <div className="w-1/3 flex justify-end">
                  <ChangeIndicator diff={diff} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrity Analysis */}
      {(scoringResult1?.audit?.integrity_gaps || scoringResult2?.audit?.integrity_gaps) && (
        <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
          <SectionHeading
            variant="small"
            icon={<AlertTriangle className="w-4 h-4 text-(--color-accent)" />}
          >
            Integrity Analysis
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {[
              { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
              { sr: scoringResult2, assessment: assessment2, color: 'blue' },
            ].map(({ sr, assessment, color }) => {
              const gaps = sr?.audit?.integrity_gaps || [];
              const { strengths, gaps: gapsOnly } = categorizeIntegrityGaps(gaps);

              return (
                <div
                  key={assessment.id}
                  className={color === 'emerald' ? 'border-r border-(--color-border) pr-8' : 'pl-8'}
                >
                  <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">
                    {assessment.title}
                  </p>

                  <div className="space-y-4">
                    {/* Strengths Validated */}
                    {strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-(--color-text-primary) mb-3">
                          Strengths Validated ({strengths.length})
                        </p>
                        <div className="space-y-2">
                          {strengths.map((strength, i) => (
                            <div
                              key={i}
                              className="py-2.5 border-b border-(--color-border) last:border-0 flex items-start gap-3"
                            >
                              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#4a7c59]" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-(--color-text-primary)">
                                  {strength.gap}
                                </p>
                                {strength.severity && (
                                  <Chip variant="tag" className="text-xs mt-1">
                                    {strength.severity}
                                  </Chip>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Areas for Improvement */}
                    {gapsOnly.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-(--color-text-primary) mb-3">
                          Areas for Improvement ({gapsOnly.length})
                        </p>
                        <div className="space-y-2">
                          {gapsOnly.map((gap, i) => (
                            <div
                              key={i}
                              className="py-2.5 border-b border-(--color-border) last:border-0 flex items-start gap-3"
                            >
                              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-(--color-text-primary)">
                                  {gap.gap}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  <Chip variant="tag" className="text-xs">
                                    {gap.severity || 'medium'}
                                  </Chip>
                                  {gap.evidence_source_id && (
                                    <Chip
                                      variant="tag"
                                      className="text-xs text-(--color-text-muted)"
                                    >
                                      ID: {gap.evidence_source_id}
                                    </Chip>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {strengths.length === 0 && gapsOnly.length === 0 && (
                      <div className="p-4 text-center text-sm text-(--color-text-muted)">
                        No integrity gaps recorded
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full AI Audit Summary */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <SectionHeading
          variant="small"
          icon={<Lightbulb className="w-4 h-4 text-(--color-accent)" />}
        >
          AI Audit Summary
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="border-r border-(--color-border) pr-8">
            <AuditSummaryCard result={scoringResult1} variant="transparent" />
          </div>
          <div className="pl-8">
            <AuditSummaryCard result={scoringResult2} variant="transparent" />
          </div>
        </div>
      </div>
    </>
  );
}

FactorAnalysisTab.propTypes = {
  /** First assessment object */
  assessment1: PropTypes.object.isRequired,
  /** Second assessment object */
  assessment2: PropTypes.object.isRequired,
  /** First assessment's scoring result */
  scoringResult1: PropTypes.object.isRequired,
  /** Second assessment's scoring result */
  scoringResult2: PropTypes.object.isRequired,
  /** Array of factor differences between assessments */
  factorDiffs: PropTypes.arrayOf(PropTypes.object),
  /** Data for radar chart visualization */
  radarChartData: PropTypes.array,
  /** Configuration for radar chart */
  radarConfigs: PropTypes.array,
  /** Data for bar chart visualization */
  barChartData: PropTypes.array,
  /** Configuration for bar chart */
  barConfigs: PropTypes.array,
  /** Function to determine color based on score value */
  getScoreColor: PropTypes.func,
};

export default FactorAnalysisTab;
