import { Card, Chip, ProgressBar, Table } from '@heroui/react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitCompare,
  Lightbulb,
  Search,
  Zap,
} from 'lucide-react';
import PropTypes from 'prop-types';

import BarChart from '@/components/charts/BarChart';
import RadarChart from '@/components/charts/RadarChart';
import { titleize } from '@/lib/formatting';
import { formatFactorName } from '@/lib/scoring';
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-0">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <GitCompare style={{ color: 'var(--accent)' }} size={20} />
            </div>
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              Factor Comparison (Radar)
            </Card.Title>
          </Card.Header>
          <Card.Content className="pb-4">
            <div className="h-100 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              {radarChartData && radarConfigs ? (
                <RadarChart
                  data={radarChartData}
                  radarConfigs={radarConfigs}
                  height={400}
                  showLegend
                  showTooltip
                />
              ) : (
                <div
                  className="h-full flex items-center justify-center"
                  style={{ color: 'var(--muted)' }}
                >
                  Loading chart data...
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Bar Chart */}
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-0">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <BarChart3 style={{ color: 'var(--accent)' }} size={20} />
            </div>
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              Score Comparison (Bar)
            </Card.Title>
          </Card.Header>
          <Card.Content className="pb-4">
            <div className="h-100 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
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
                <div
                  className="h-full flex items-center justify-center"
                  style={{ color: 'var(--muted)' }}
                >
                  Loading chart data...
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Detailed Factor Progress */}
      <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-linear-to-br from-indigo-50/30 to-white">
        <Card.Header className="flex items-center gap-3 pb-0">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200">
            <Zap className="text-indigo-700" size={20} />
          </div>
          <Card.Title className="font-bold text-lg text-slate-900">
            Detailed Factor Analysis
          </Card.Title>
        </Card.Header>
        <Card.Content className="gap-4">
          {factorDiffs?.length > 0 ? (
            factorDiffs.map((factor) => (
              <div
                key={factor.factor}
                className="space-y-3 pb-4 border-b border-slate-200 last:border-0 hover:bg-slate-50/50 p-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{factor.label}</h4>
                  <div className="flex items-center gap-2">
                    <Chip
                      color={getScoreColor(factor.a1)}
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      <Chip.Label className="font-semibold">{factor.a1}</Chip.Label>
                    </Chip>
                    <ArrowRight className="text-slate-400" size={12} />
                    <Chip
                      color={getScoreColor(factor.a2)}
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      <Chip.Label className="font-semibold">{factor.a2}</Chip.Label>
                    </Chip>
                    <ChangeIndicator diff={factor.diff} />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-emerald-700 font-semibold">
                      {assessment1.title}
                    </div>
                    <ProgressBar
                      value={factor.a1}
                      className="h-2.5 rounded-full bg-emerald-500"
                      aria-label={`${assessment1.title} factor score`}
                    />
                  </div>
                  <span className="text-xs text-emerald-700 font-bold w-10 text-right">
                    {factor.a1}%
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-amber-600 font-semibold">{assessment2.title}</div>
                    <ProgressBar
                      value={factor.a2}
                      className="h-2.5 rounded-full bg-amber-500"
                      aria-label={`${assessment2.title} factor score`}
                    />
                  </div>
                  <span className="text-xs text-amber-600 font-bold w-10 text-right">
                    {factor.a2}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">No factor analysis data available</div>
          )}
        </Card.Content>
      </Card>

      {/* Factor-by-Factor Table */}
      <Card className="border-2 border-cyan-200 shadow-md rounded-xl bg-linear-to-br from-cyan-50/30 to-white">
        <Card.Header className="flex gap-3 items-center pb-3">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-cyan-100 to-cyan-200">
            <Search className="text-cyan-700" size={20} />
          </div>
          <Card.Title className="font-bold text-lg text-slate-900">
            Factor-by-Factor Comparison
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Factor comparison table" className="min-w-150">
                <Table.Header>
                  <Table.Column className="w-[35%]" isRowHeader>
                    FACTOR
                  </Table.Column>
                  <Table.Column className="text-center">{assessment1.title}</Table.Column>
                  <Table.Column className="text-center">{assessment2.title}</Table.Column>
                  <Table.Column className="text-center">CHANGE</Table.Column>
                </Table.Header>
                <Table.Body>
                  {Object.entries(scoringResult1?.sub_scores || {}).map(([factor, val1]) => {
                    const val2 = scoringResult2?.sub_scores?.[factor] || 0;
                    const diff = val2 - val1;
                    return (
                      <Table.Row
                        key={factor}
                        className="hover:bg-slate-50/50 transition-colors duration-150"
                      >
                        <Table.Cell className="font-semibold text-slate-900">
                          {titleize(factor)}
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          <Chip
                            color={getScoreColor(val1)}
                            variant="soft"
                            size="md"
                            className="transition-all duration-200"
                          >
                            <Chip.Label className="font-bold">{val1}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          <Chip
                            color={getScoreColor(val2)}
                            variant="soft"
                            size="md"
                            className="transition-all duration-200"
                          >
                            <Chip.Label className="font-bold">{val2}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          <ChangeIndicator diff={diff} />
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Integrity Analysis */}
      {(scoringResult1?.audit?.integrity_gaps || scoringResult2?.audit?.integrity_gaps) && (
        <Card className="border-2 border-red-200 shadow-md rounded-xl bg-linear-to-br from-red-50/30 to-white">
          <Card.Header className="flex items-center gap-3 pb-4">
            <div className="p-2.5 rounded-lg bg-linear-to-br from-red-100 to-red-200">
              <AlertTriangle className="text-red-700" size={20} />
            </div>
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              Integrity Analysis
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
                { sr: scoringResult2, assessment: assessment2, color: 'blue' },
              ].map(({ sr, assessment, color }) => {
                const gaps = sr?.audit?.integrity_gaps || [];
                const { strengths, gaps: gapsOnly } = categorizeIntegrityGaps(gaps);

                return (
                  <Card key={assessment.id} className="border border-slate-200 bg-white">
                    <Card.Header className="pb-3">
                      <Card.Title className="font-bold text-slate-900">
                        {assessment.title}
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                      {/* Strengths Validated */}
                      {strengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-3">
                            Strengths Validated ({strengths.length})
                          </h4>
                          <div className="space-y-2">
                            {strengths.map((strength, i) => (
                              <div
                                key={i}
                                className="p-3 bg-green-50 border border-green-200 rounded-lg"
                              >
                                <div className="flex items-start gap-2">
                                  <CheckCircle2
                                    className="text-green-700 shrink-0 mt-0.5"
                                    size={16}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {strength.gap}
                                    </p>
                                    {strength.severity && (
                                      <Chip
                                        variant="soft"
                                        size="sm"
                                        className={`text-xs mt-1 ${
                                          strength.severity === 'high'
                                            ? 'text-green-700 bg-green-100'
                                            : strength.severity === 'medium'
                                              ? 'text-blue-700 bg-blue-100'
                                              : 'text-slate-600 bg-slate-100'
                                        }`}
                                      >
                                        {strength.severity}
                                      </Chip>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {gapsOnly.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-3">
                            Areas for Improvement ({gapsOnly.length})
                          </h4>
                          <div className="space-y-2">
                            {gapsOnly.map((gap, i) => (
                              <div
                                key={i}
                                className={`p-3 border rounded-lg ${
                                  gap.severity === 'high'
                                    ? 'bg-red-50 border-red-200'
                                    : gap.severity === 'medium'
                                      ? 'bg-amber-50 border-amber-200'
                                      : 'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <AlertTriangle
                                    className={`shrink-0 mt-0.5 ${
                                      gap.severity === 'high'
                                        ? 'text-red-700'
                                        : gap.severity === 'medium'
                                          ? 'text-amber-700'
                                          : 'text-blue-700'
                                    }`}
                                    size={16}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {gap.gap}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                      <Chip
                                        variant="soft"
                                        size="sm"
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
                                      {gap.evidence_source_id && (
                                        <Chip
                                          variant="soft"
                                          size="sm"
                                          className="text-xs text-slate-600 bg-slate-100"
                                        >
                                          ID: {gap.evidence_source_id}
                                        </Chip>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {strengths.length === 0 && gapsOnly.length === 0 && (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          No integrity gaps recorded
                        </div>
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Full AI Audit Summary */}
      {(scoringResult1?.audit || scoringResult2?.audit) && (
        <Card className="border-2 border-indigo-200 shadow-md rounded-xl bg-linear-to-br from-indigo-50/30 to-white">
          <Card.Header className="flex items-center gap-3 pb-4">
            <div className="p-2.5 rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200">
              <Lightbulb className="text-indigo-700" size={20} />
            </div>
            <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              AI Audit Summary
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { sr: scoringResult1, assessment: assessment1, color: 'emerald' },
                { sr: scoringResult2, assessment: assessment2, color: 'blue' },
              ].map(({ sr, assessment, color }) => {
                const audit = sr?.audit || {};
                if (!audit) return null;

                return (
                  <Card key={assessment.id} className="border border-slate-200 bg-white">
                    <Card.Header className="pb-3">
                      <Card.Title className="font-bold text-slate-900">
                        {assessment.title}
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-5">
                      {/* Strengths */}
                      {audit.strengths && audit.strengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {audit.strengths.map((strength, i) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                <CheckCircle2
                                  size={14}
                                  className="text-green-600 shrink-0 mt-0.5"
                                />
                                <span>{strength.aspect || strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Technical Recommendations */}
                      {audit.technical_recommendations &&
                        audit.technical_recommendations.length > 0 && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-bold text-blue-900 mb-2">
                              Technical Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {audit.technical_recommendations.map((rec, i) => (
                                <li key={i} className="text-sm text-blue-800 flex gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Improvement Roadmap */}
                      {audit.improvement_roadmap && audit.improvement_roadmap.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-2">
                            Improvement Roadmap
                          </h4>
                          <div className="space-y-2">
                            {audit.improvement_roadmap.map((item, i) => (
                              <div
                                key={i}
                                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2"
                              >
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                    item.priority === 1 || item.priority === '1'
                                      ? 'bg-red-100 text-red-700'
                                      : item.priority === 2 || item.priority === '2'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {item.priority}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {item.action}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.target_factor && (
                                      <Chip
                                        size="sm"
                                        variant="soft"
                                        className="text-xs text-slate-600 bg-slate-100"
                                      >
                                        {formatFactorName(item.target_factor)}
                                      </Chip>
                                    )}
                                    {item.impact && (
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
                                    )}
                                    {item.effort && (
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
                                    )}
                                    {item.timeframe && (
                                      <Chip
                                        size="sm"
                                        variant="soft"
                                        className="text-xs text-slate-500 bg-slate-50"
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

                      {/* SDG Alignment */}
                      {audit.sdg_alignment && audit.sdg_alignment.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-2">
                            UN Sustainable Development Goals
                          </h4>
                          <div className="space-y-2">
                            {audit.sdg_alignment.map((sdg, i) => (
                              <div
                                key={i}
                                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {sdg.sdg_number}
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs font-semibold text-slate-800">
                                    {sdg.sdg_name}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {sdg.rationale}
                                  </div>
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

                      {/* Market Opportunity */}
                      {audit.market_opportunity_summary && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">
                            Market Opportunity
                          </h4>
                          <p className="text-sm text-blue-900">
                            {audit.market_opportunity_summary}
                          </p>
                        </div>
                      )}

                      {/* Key Metrics Comparison */}
                      {audit.key_metrics_comparison &&
                        Object.keys(audit.key_metrics_comparison).length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Key Metrics</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(audit.key_metrics_comparison).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg"
                                >
                                  <p className="text-xs text-slate-600 truncate font-semibold">
                                    {key}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 truncate">
                                    {value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </Card.Content>
                  </Card>
                );
              })}
            </div>
          </Card.Content>
        </Card>
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
