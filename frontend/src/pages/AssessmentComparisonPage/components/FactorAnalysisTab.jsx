import { AlertTriangle, CheckCircle2, GitCompare, Lightbulb, Search, Zap } from 'lucide-react';
import PropTypes from 'prop-types';

import BarChart from '@/components/charts/BarChart';
import RadarChart from '@/components/charts/RadarChart';
import { Chip } from '@/components/common';
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
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
          <GitCompare size={14} />
          Visual Comparison
        </p>

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
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
          <Zap size={14} />
          Detailed Factor Analysis
        </p>

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
                    className="h-full bg-[rgba(74,124,89,0.7)] rounded-full"
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

      {/* Factor-by-Factor Table */}
      <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
          <Search size={14} />
          Factor-by-Factor Comparison
        </p>

        <div className="space-y-0">
          {Object.entries(scoringResult1?.sub_scores || {}).map(([factor, val1]) => {
            const val2 = scoringResult2?.sub_scores?.[factor] || 0;
            const diff = val2 - val1;
            return (
              <div
                key={factor}
                className="flex justify-between items-center py-2.5 border-b border-(--color-border) last:border-0 text-sm"
              >
                <span className="text-(--color-text-muted) w-1/3">{titleize(factor)}</span>
                <div className="flex items-center gap-4 w-2/3 justify-end">
                  <Chip
                    variant="tag"
                    className={`text-xs ${getScoreColor(val1) === 'success' ? 'text-(--color-success)' : getScoreColor(val1) === 'warning' ? 'text-(--color-warning)' : 'text-(--color-error)'}`}
                  >
                    {val1}
                  </Chip>
                  <Chip
                    variant="tag"
                    className={`text-xs ${getScoreColor(val2) === 'success' ? 'text-(--color-success)' : getScoreColor(val2) === 'warning' ? 'text-(--color-warning)' : 'text-(--color-error)'}`}
                  >
                    {val2}
                  </Chip>
                  <span className="shrink-0">
                    <ChangeIndicator diff={diff} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrity Analysis */}
      {(scoringResult1?.audit?.integrity_gaps || scoringResult2?.audit?.integrity_gaps) && (
        <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
          <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
            <AlertTriangle size={14} />
            Integrity Analysis
          </p>

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
      {(scoringResult1?.audit || scoringResult2?.audit) && (
        <div className="border-t border-(--color-border) pt-8 mt-8 first:border-0 first:pt-0 first:mt-0">
          <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-6 flex items-center gap-2">
            <Lightbulb size={14} />
            AI Audit Summary
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {[
              { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
              { sr: scoringResult2, assessment: assessment2, color: 'blue' },
            ].map(({ sr, assessment, color }) => {
              const audit = sr?.audit || {};
              if (!audit) return null;

              return (
                <div
                  key={assessment.id}
                  className={color === 'emerald' ? 'border-r border-(--color-border) pr-8' : 'pl-8'}
                >
                  <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">
                    {assessment.title}
                  </p>

                  <div className="space-y-4">
                    {/* Strengths */}
                    {audit.strengths && audit.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-(--color-text-primary) mb-2">
                          Strengths
                        </p>
                        <ul className="space-y-1">
                          {audit.strengths.map((strength, i) => (
                            <li
                              key={i}
                              className="text-sm flex items-start gap-2 text-(--color-text-secondary)"
                            >
                              <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-[#4a7c59]" />
                              <span>{strength.aspect || strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Technical Recommendations */}
                    {audit.technical_recommendations &&
                      audit.technical_recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#5a7a9a] mb-2">
                            Technical Recommendations
                          </p>
                          <ul className="space-y-1">
                            {audit.technical_recommendations.map((rec, i) => (
                              <li
                                key={i}
                                className="text-sm flex gap-2 text-(--color-text-primary)"
                              >
                                <span className="text-(--color-accent)">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Market Opportunity */}
                    {audit.market_opportunity_summary && (
                      <div>
                        <p className="text-xs font-bold mb-1 uppercase tracking-wide text-[#5a7a9a]">
                          Market Opportunity
                        </p>
                        <p className="text-sm text-(--color-text-primary) leading-relaxed">
                          {audit.market_opportunity_summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
