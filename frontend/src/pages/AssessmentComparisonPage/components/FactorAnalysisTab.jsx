import { Card, ProgressBar, Table } from '@heroui/react';
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
import { Chip } from '@/components/common';
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
          style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
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
            <div className="h-100 p-4 rounded-lg" style={{ backgroundColor: 'transparent' }}>
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
          style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
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
            <div className="h-100 p-4 rounded-lg" style={{ backgroundColor: 'transparent' }}>
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
      <Card
        className="border-2 rounded-xl"
        style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
      >
        <Card.Header className="flex items-center gap-3 pb-0">
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <Zap style={{ color: 'var(--accent)' }} size={20} />
          </div>
          <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            Detailed Factor Analysis
          </Card.Title>
        </Card.Header>
        <Card.Content className="gap-4">
          {factorDiffs?.length > 0 ? (
            factorDiffs.map((factor) => (
              <div
                key={factor.factor}
                className="space-y-3 pb-4 border-b last:border-0 p-3 rounded-lg transition-colors duration-200 hover:bg-accent-soft"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    {factor.label}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Chip
                      color={getScoreColor(factor.a1)}
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      {factor.a1}
                    </Chip>
                    <ArrowRight size={12} style={{ color: 'var(--muted)' }} />
                    <Chip
                      color={getScoreColor(factor.a2)}
                      variant="soft"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      {factor.a2}
                    </Chip>
                    <ChangeIndicator diff={factor.diff} />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                      {assessment1.title}
                    </div>
                    <ProgressBar
                      value={factor.a1}
                      className="h-2.5 rounded-full"
                      style={{ backgroundColor: 'var(--success)' }}
                      aria-label={`${assessment1.title} factor score`}
                    />
                  </div>
                  <span
                    className="text-xs font-bold w-10 text-right"
                    style={{ color: 'var(--success)' }}
                  >
                    {factor.a1}%
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      {assessment2.title}
                    </div>
                    <ProgressBar
                      value={factor.a2}
                      className="h-2.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                      aria-label={`${assessment2.title} factor score`}
                    />
                  </div>
                  <span
                    className="text-xs font-bold w-10 text-right"
                    style={{ color: 'var(--accent)' }}
                  >
                    {factor.a2}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
              No factor analysis data available
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Factor-by-Factor Table */}
      <Card
        className="border-2 rounded-xl"
        style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
      >
        <Card.Header className="flex gap-3 items-center pb-3">
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <Search style={{ color: 'var(--accent)' }} size={20} />
          </div>
          <Card.Title className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
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
                        className="hover:bg-accent-soft transition-colors duration-150"
                      >
                        <Table.Cell
                          className="font-semibold"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {titleize(factor)}
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          <Chip
                            color={getScoreColor(val1)}
                            variant="soft"
                            size="md"
                            className="transition-all duration-200"
                          >
                            {val1}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="text-center">
                          <Chip
                            color={getScoreColor(val2)}
                            variant="soft"
                            size="md"
                            className="transition-all duration-200"
                          >
                            {val2}
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
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-4">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--danger-soft)' }}>
              <AlertTriangle style={{ color: 'var(--danger)' }} size={20} />
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
                  <Card
                    key={assessment.id}
                    className="border rounded-xl"
                    style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
                  >
                    <Card.Header className="pb-3">
                      <Card.Title className="font-bold" style={{ color: 'var(--foreground)' }}>
                        {assessment.title}
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                      {/* Strengths Validated */}
                      {strengths.length > 0 && (
                        <div>
                          <h4
                            className="text-sm font-bold mb-3"
                            style={{ color: 'var(--foreground)' }}
                          >
                            Strengths Validated ({strengths.length})
                          </h4>
                          <div className="space-y-2">
                            {strengths.map((strength, i) => (
                              <div
                                key={i}
                                className="p-3 border rounded-lg"
                                style={{
                                  backgroundColor: 'var(--success-soft)',
                                  borderColor: 'var(--success)',
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  <CheckCircle2
                                    size={16}
                                    style={{ color: 'var(--success)' }}
                                    className="shrink-0 mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <p
                                      className="text-sm font-semibold"
                                      style={{ color: 'var(--foreground)' }}
                                    >
                                      {strength.gap}
                                    </p>
                                    {strength.severity && (
                                      <Chip
                                        variant="soft"
                                        size="sm"
                                        className="text-xs mt-1"
                                        style={{
                                          color:
                                            strength.severity === 'high'
                                              ? 'var(--success)'
                                              : strength.severity === 'medium'
                                                ? 'var(--info)'
                                                : 'var(--muted)',
                                        }}
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
                          <h4
                            className="text-sm font-bold mb-3"
                            style={{ color: 'var(--foreground)' }}
                          >
                            Areas for Improvement ({gapsOnly.length})
                          </h4>
                          <div className="space-y-2">
                            {gapsOnly.map((gap, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg"
                                style={{
                                  backgroundColor:
                                    gap.severity === 'high'
                                      ? 'var(--danger-soft)'
                                      : gap.severity === 'medium'
                                        ? 'var(--warning-soft)'
                                        : 'var(--info-soft)',
                                  borderColor:
                                    gap.severity === 'high'
                                      ? 'var(--danger)'
                                      : gap.severity === 'medium'
                                        ? 'var(--warning)'
                                        : 'var(--info)',
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  <AlertTriangle
                                    size={16}
                                    className="shrink-0 mt-0.5"
                                    style={{
                                      color:
                                        gap.severity === 'high'
                                          ? 'var(--danger)'
                                          : gap.severity === 'medium'
                                            ? 'var(--warning)'
                                            : 'var(--info)',
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p
                                      className="text-sm font-semibold"
                                      style={{ color: 'var(--foreground)' }}
                                    >
                                      {gap.gap}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                      <Chip
                                        variant="soft"
                                        size="sm"
                                        className="text-xs"
                                        style={{
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
                                      {gap.evidence_source_id && (
                                        <Chip
                                          variant="soft"
                                          size="sm"
                                          className="text-xs"
                                          style={{ color: 'var(--muted)' }}
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
                        <div className="p-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
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
        <Card
          className="border-2 rounded-xl"
          style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
        >
          <Card.Header className="flex items-center gap-3 pb-4">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <Lightbulb style={{ color: 'var(--accent)' }} size={20} />
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
                  <Card
                    key={assessment.id}
                    className="border rounded-xl"
                    style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
                  >
                    <Card.Header className="pb-3">
                      <Card.Title className="font-bold" style={{ color: 'var(--foreground)' }}>
                        {assessment.title}
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-5">
                      {/* Strengths */}
                      {audit.strengths && audit.strengths.length > 0 && (
                        <div>
                          <h4
                            className="text-sm font-bold mb-2"
                            style={{ color: 'var(--foreground)' }}
                          >
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {audit.strengths.map((strength, i) => (
                              <li
                                key={i}
                                className="text-sm flex items-start gap-2"
                                style={{ color: 'var(--muted)' }}
                              >
                                <CheckCircle2
                                  size={14}
                                  className="shrink-0 mt-0.5"
                                  style={{ color: 'var(--success)' }}
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
                          <div
                            className="p-3 border-l-4 rounded-lg"
                            style={{
                              backgroundColor: 'var(--info-soft)',
                              borderLeftColor: 'var(--info)',
                            }}
                          >
                            <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--info)' }}>
                              Technical Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {audit.technical_recommendations.map((rec, i) => (
                                <li
                                  key={i}
                                  className="text-sm flex gap-2"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  <span style={{ color: 'var(--accent)' }}>•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Improvement Roadmap */}
                      {audit.improvement_roadmap && audit.improvement_roadmap.length > 0 && (
                        <div>
                          <h4
                            className="text-sm font-bold mb-2"
                            style={{ color: 'var(--foreground)' }}
                          >
                            Improvement Roadmap
                          </h4>
                          <div className="space-y-2">
                            {audit.improvement_roadmap.map((item, i) => (
                              <div
                                key={i}
                                className="p-3 border rounded-lg flex gap-2"
                                style={{
                                  backgroundColor: 'transparent',
                                  borderColor: 'var(--border)',
                                }}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
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
                                  <p
                                    className="text-sm font-semibold"
                                    style={{ color: 'var(--foreground)' }}
                                  >
                                    {item.action}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.target_factor && (
                                      <Chip
                                        size="sm"
                                        variant="soft"
                                        style={{ color: 'var(--muted)' }}
                                      >
                                        {formatFactorName(item.target_factor)}
                                      </Chip>
                                    )}
                                    {item.impact && (
                                      <Chip
                                        size="sm"
                                        variant="soft"
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
                                        size="sm"
                                        variant="soft"
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
                                        size="sm"
                                        variant="soft"
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

                      {/* SDG Alignment */}
                      {audit.sdg_alignment && audit.sdg_alignment.length > 0 && (
                        <div>
                          <h4
                            className="text-sm font-bold mb-2"
                            style={{ color: 'var(--foreground)' }}
                          >
                            UN Sustainable Development Goals
                          </h4>
                          <div className="space-y-2">
                            {audit.sdg_alignment.map((sdg, i) => (
                              <div
                                key={i}
                                className="p-3 border rounded-lg flex gap-2"
                                style={{
                                  backgroundColor: 'transparent',
                                  borderColor: 'var(--border)',
                                }}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 text-white"
                                  style={{ backgroundColor: 'var(--info)' }}
                                >
                                  {sdg.sdg_number}
                                </div>
                                <div className="flex-1">
                                  <div
                                    className="text-xs font-semibold"
                                    style={{ color: 'var(--foreground)' }}
                                  >
                                    {sdg.sdg_name}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                    {sdg.rationale}
                                  </div>
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    style={{
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

                      {/* Market Opportunity */}
                      {audit.market_opportunity_summary && (
                        <div
                          className="p-3 border-l-4 rounded-lg"
                          style={{
                            backgroundColor: 'var(--info-soft)',
                            borderLeftColor: 'var(--info)',
                          }}
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

                      {/* Key Metrics Comparison */}
                      {audit.key_metrics_comparison &&
                        Object.keys(audit.key_metrics_comparison).length > 0 && (
                          <div>
                            <h4
                              className="text-sm font-bold mb-2"
                              style={{ color: 'var(--foreground)' }}
                            >
                              Key Metrics
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(audit.key_metrics_comparison).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="p-2 border rounded-lg"
                                  style={{
                                    backgroundColor: 'transparent',
                                    borderColor: 'var(--border)',
                                  }}
                                >
                                  <p
                                    className="text-xs truncate font-semibold"
                                    style={{ color: 'var(--muted)' }}
                                  >
                                    {key}
                                  </p>
                                  <p
                                    className="text-sm font-bold truncate"
                                    style={{ color: 'var(--foreground)' }}
                                  >
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
