/**
 * Composes global analytics charts, KPI cards, benchmark tables, and signed-in user metrics.
 */

import { Table } from '@heroui/react';
import { LogIn, ScrollText } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { BarChart, LineChart, PieChart } from '@/components/charts';
import { DetailsDisplay } from '@/components/common';
import { useAssessmentStats, useGlobalStats } from '@/features/assessments/hooks';
import { useAuth } from '@/hooks';
import {
  getRiskColors,
  getScaleColors,
  getTierColors,
  resolveCSSVar,
  transformGeoDistribution,
  transformIndustryDistribution,
  transformMaterialDistribution,
  transformRiskDistribution,
  transformScaleDistribution,
  transformScoreDistribution,
  transformTierDistribution,
  transformWeeklyTrend,
  usablePie,
} from '@/utils/chartHelpers';
import { getChartTheme } from '@/utils/chartTheme';
import { cn } from '@/utils/cn';

import ChartPanel from './ChartPanel';
import DashboardSectionHeading from './DashboardSectionHeading';
import EmptyChart from './EmptyChart';
import SingleValueChart from './SingleValueChart';
import StatCard from './StatCard';

// Material colors for pie chart - factory function to resolve at render time
const getMaterialColors = () => [
  resolveCSSVar('var(--color-material-slate)', '#64748b'), // muted slate blue
  resolveCSSVar('var(--chart-4)', '#8b3a3a'), // muted terracotta
  resolveCSSVar('var(--chart-2)', '#4a7c59'), // dark forest green
  resolveCSSVar('var(--color-material-ocean)', '#0369a1'), // ocean blue
  resolveCSSVar('var(--color-material-sage)', '#6b8e7f'), // sage
  resolveCSSVar('var(--chart-3)', '#b07d3a'), // muted amber
  resolveCSSVar('var(--chart-1)', '#b8916a'), // warm accent brown
  resolveCSSVar('var(--chart-6)', '#9a8f82'), // text muted
];

// Helper function outside component to avoid re-creation
const formatIndustry = (s) => (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Main ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders global assessment analytics and user-specific benchmark sections when authenticated.
 */
export default function GlobalActivity() {
  const { user } = useAuth();
  const {
    totalAssessments: userTotal,
    averageScore: userAvg,
    medianScore: userMedian,
    minScore: userMin,
    maxScore: userMax,
    avgConfidence: userConf,
    avgTechnicalFeasibility: userTechFeas,
    avgEconomicViability: userEconViab,
    avgCircularityPotential: userCircPot,
    assessmentsByIndustry: userByIndustry,
    assessmentsByRisk: userByRisk,
    isLoading: userStatsLoading,
  } = useAssessmentStats({ enabled: !!user });

  // Normalize the user's industry stats into the same chart shape used by global distributions.
  const userIndustryData = useMemo(
    () =>
      transformIndustryDistribution(
        Object.entries(userByIndustry || {})
          .map(([industry, val]) => ({
            industry: industry.replace(/_/g, ' '),
            count: typeof val === 'object' ? val.count : val,
            avg_score: typeof val === 'object' ? (val.avg_score ?? null) : null,
          }))
          .sort((a, b) => b.count - a.count),
        Infinity,
      ),
    [userByIndustry],
  );

  const userRiskData = useMemo(() => transformRiskDistribution(userByRisk), [userByRisk]);

  // ── Global data ─────────────────────────────────────────────────────────────────────
  const {
    totalScoringCalls,
    avgScore,
    avgConfidence,
    avgTechFeas,
    avgEconViab,
    avgCircPot,
    avgParamConsistency,
    avgRAlignment,
    scoreDistribution,
    tierDistribution,
    riskDistribution,
    industryDistribution,
    strategyDistribution,
    weeklyTrend,
    materialDistribution,
    geoDistribution,
    scaleDistribution,
    junkRate,
    totalSavedAssessments,
    assessmentsByTier,
    assessmentsByRisk,
    isLoading: globalLoading,
  } = useGlobalStats();

  // ── Chart data (all memoised) ─────────────────────────────────────────────────

  const scoreDistData = useMemo(
    () => transformScoreDistribution(scoreDistribution),
    [scoreDistribution],
  );

  const tierDistData = useMemo(
    () => transformTierDistribution(tierDistribution),
    [tierDistribution],
  );

  const riskDistData = useMemo(
    () => transformRiskDistribution(riskDistribution),
    [riskDistribution],
  );

  const strategyData = useMemo(
    () =>
      strategyDistribution
        .filter((s) => s.strategy && s.strategy !== 'unknown')
        .slice(0, 8)
        .map((s) => ({ name: s.strategy, value: Number(s.count) })),
    [strategyDistribution],
  );

  const industryBarData = useMemo(
    () => transformIndustryDistribution(industryDistribution, 10),
    [industryDistribution],
  );

  const weeklyData = useMemo(() => transformWeeklyTrend(weeklyTrend), [weeklyTrend]);

  // Use a trailing three-week window to smooth sparse weekly volume data.
  const weeklyWithRolling = useMemo(() => {
    return weeklyData.map((d, i, arr) => {
      const window = arr.slice(Math.max(0, i - 2), i + 1);
      const rollingAvg = Math.round(window.reduce((s, w) => s + w.count, 0) / window.length);
      return { ...d, rolling: rollingAvg };
    });
  }, [weeklyData]);

  const weekOverWeekGrowth = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const last = weeklyData[weeklyData.length - 1]?.count ?? 0;
    const prev = weeklyData[weeklyData.length - 2]?.count ?? 0;
    if (prev === 0) return null;
    return (((last - prev) / prev) * 100).toFixed(1);
  }, [weeklyData]);

  const industryTableRows = useMemo(() => {
    if (!industryBarData.length) return [];
    const total = industryBarData.reduce((sum, r) => sum + (r.count ?? 0), 0);
    return industryBarData
      .filter((r) => r.count > 0)
      .map((r) => ({
        industry: r.name,
        count: r.count,
        avgScore: r.avgScore,
        share: total > 0 ? (r.count / total) * 100 : null,
      }))
      .sort((a, b) => b.count - a.count);
  }, [industryBarData]);

  const topStrategy = useMemo(() => {
    const valid = strategyData.filter((s) => s.name && s.name !== 'unknown');
    return valid.length > 0 ? valid.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  }, [strategyData]);

  const topPerformer = useMemo(() => {
    const valid = industryTableRows.filter((r) => r.avgScore !== null);
    if (!valid.length) return null;
    return [...valid].sort((a, b) => b.avgScore - a.avgScore)[0];
  }, [industryTableRows]);

  const materialData = useMemo(
    () => transformMaterialDistribution(materialDistribution, 8),
    [materialDistribution],
  );

  const scaleData = useMemo(
    () => transformScaleDistribution(scaleDistribution, 6),
    [scaleDistribution],
  );

  const geoData = useMemo(() => transformGeoDistribution(geoDistribution, 8), [geoDistribution]);

  // Saved-assessment charts use counts from saved records rather than raw scoring sessions.
  const savedTierData = useMemo(
    () =>
      Object.entries(assessmentsByTier || {})
        .filter(([t, v]) => t && t !== 'Unknown' && v > 0)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value),
    [assessmentsByTier],
  );

  const savedRiskData = useMemo(
    () =>
      Object.entries(assessmentsByRisk || {})
        .filter(([r, v]) => r && r !== 'unknown' && v > 0)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: Number(value),
        }))
        .sort((a, b) => b.value - a.value),
    [assessmentsByRisk],
  );

  const qualityRate = junkRate !== null ? (100 - junkRate).toFixed(1) : null;
  const junkCount = junkRate !== null ? Math.round((junkRate / 100) * totalScoringCalls) : 0;

  // ── Chart: PieChart or SingleValue fallback ──────────────────────────────────────────
  const renderPieOrSingle = (data, colors, emptyMsg) => {
    if (!data || data.length === 0) return <EmptyChart message={emptyMsg} />;
    if (data.length === 1 || !usablePie(data)) {
      return <SingleValueChart label={data[0]?.name} value={data[0]?.value} />;
    }

    return (
      <PieChart
        data={data}
        dataKey="value"
        nameKey="name"
        height={250}
        showLegend={true}
        innerRadius={0}
        colors={colors}
      />
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — GLOBAL ACTIVITY
          ════════════════════════════════════════════════════════════════ */}
      <section>
        {/* <DashboardSectionHeading label="GLOBAL ACTIVITY" /> */}
        {/* Change top row from 3 cards to 4 cards: max-w grid */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Scored"
            value={totalScoringCalls ? totalScoringCalls.toLocaleString() : null}
            subtext="All-time scoring calls"
            loading={globalLoading}
          />
          <StatCard
            title="Avg Score"
            value={avgScore !== null ? `${Number(avgScore).toFixed(1)}%` : null}
            subtext="Across all assessments"
            loading={globalLoading}
          />
          <StatCard
            title="Saved Assessments"
            value={totalSavedAssessments || null}
            subtext="Community saved"
            loading={globalLoading}
          />
          <StatCard
            title="Input Quality"
            value={qualityRate ? `${qualityRate}%` : null}
            subtext={`Non-junk inputs${junkCount > 0 ? ` (${junkCount.toLocaleString()} filtered)` : ''}`}
            loading={globalLoading}
          />
        </div>

        {/* Derived metrics 6-grid — SHORT labels to avoid truncation */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Confidence"
            value={avgConfidence !== null ? `${Number(avgConfidence).toFixed(1)}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Tech Feas."
            value={avgTechFeas !== null ? `${Number(avgTechFeas).toFixed(1)}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Econ Viab."
            value={avgEconViab !== null ? `${Number(avgEconViab).toFixed(1)}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Circularity"
            value={avgCircPot !== null ? `${Number(avgCircPot).toFixed(1)}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Param Consistency"
            value={
              avgParamConsistency !== null ? `${Number(avgParamConsistency).toFixed(1)}%` : null
            }
            loading={globalLoading}
          />
          <StatCard
            title="Strategy Alignment"
            value={avgRAlignment !== null ? `${Number(avgRAlignment).toFixed(1)}%` : null}
            loading={globalLoading}
          />
        </div>

        {/* Row A: 3 donuts with single-value fallback */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ChartPanel title="Score Distribution" isLoading={globalLoading}>
            {scoreDistData.length > 0 ? (
              <BarChart
                data={scoreDistData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: getChartTheme().colors[0], name: 'Count' }]}
                height={250}
                showGrid
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
          <ChartPanel title="CE Tier Breakdown" isLoading={globalLoading}>
            {renderPieOrSingle(tierDistData, getTierColors(), 'Tier data unavailable')}
          </ChartPanel>
          <ChartPanel title="Risk Distribution" isLoading={globalLoading}>
            {renderPieOrSingle(riskDistData, getRiskColors(), 'Risk data unavailable')}
          </ChartPanel>
        </div>
        <div className="space-y-8">
          {/* Geographic Focus — full width */}
          <ChartPanel title="Geographic Focus" isLoading={globalLoading} className="mb-6">
            {geoData.length > 0 ? (
              <BarChart
                data={geoData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: getChartTheme().colors[2], name: 'Count' }]}
                height={250}
                showGrid
                tickAngle={-35}
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          {/* Primary Material + Company Scale — 50/50 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ChartPanel title="Primary Material" isLoading={globalLoading}>
              {renderPieOrSingle(materialData, getMaterialColors(), 'No material data')}
            </ChartPanel>
            <ChartPanel title="Company Scale" isLoading={globalLoading}>
              {renderPieOrSingle(scaleData, getScaleColors(), 'No scale data')}
            </ChartPanel>
          </div>

          {/* Weekly trend — full width */}
          <ChartPanel
            title={`Weekly Volume — last 12 weeks${weekOverWeekGrowth !== null ? ` | ${weekOverWeekGrowth > 0 ? '+' : ''}${weekOverWeekGrowth}% WoW` : ''}`}
            isLoading={globalLoading}
            className="mb-4"
          >
            {weeklyWithRolling.some((d) => d.count > 0) ? (
              <LineChart
                data={weeklyWithRolling}
                xAxisKey="period"
                lines={[
                  {
                    dataKey: 'count',
                    stroke: getChartTheme().colors[0],
                    name: 'Assessments',
                    yAxisId: 'left',
                  },
                  {
                    dataKey: 'rolling',
                    stroke: getChartTheme().colors[2],
                    name: '3-wk avg',
                    strokeDasharray: '4 2',
                    yAxisId: 'left',
                  },
                  {
                    dataKey: 'averageScore',
                    stroke: getChartTheme().colors[3],
                    name: 'Avg Score',
                    yAxisId: 'right',
                  },
                ]}
                yAxisRight={{
                  tickFormatter: (v) => `${v}%`,
                  domain: [0, 100],
                }}
                height={270}
                showLegend={true}
                tickAngle={-25}
                tickAnchor="end"
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          {/* Top Strategy Callout — above the R-Strategy chart */}
          {topStrategy && !globalLoading && (
            <div className="mb-4 flex items-center gap-4 rounded-2xl border-2 border-(--color-border-ui) bg-transparent px-5 py-4">
              <div className="flex-1">
                <p className="mb-0.5 text-[0.625rem] font-semibold tracking-widest text-(--color-text-muted) uppercase">
                  Most Used R-Strategy
                </p>
                <p className="font-mono text-xl font-semibold text-(--color-text-primary)">
                  {topStrategy.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-3xl font-semibold text-(--color-accent)">
                  {topStrategy.value.toLocaleString()}
                </p>
                <p className="text-xs text-(--color-text-muted)">uses</p>
              </div>
            </div>
          )}

          {/* R-Strategy — full width */}
          <ChartPanel title="R-Strategy Distribution" isLoading={globalLoading} className="mb-4">
            {strategyData.length > 0 ? (
              <BarChart
                data={strategyData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: getChartTheme().colors[0], name: 'Count' }]}
                height={300}
                showGrid
                tickAngle={-35}
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          {/* Row C: Industry bar (full width) */}
          {(globalLoading || industryBarData.length > 0) && (
            <ChartPanel
              title="Assessment Volume by Industry — top 10 (excluding uncategorized)"
              isLoading={globalLoading}
            >
              {industryBarData.length > 0 ? (
                <BarChart
                  data={industryBarData}
                  xAxisKey="name"
                  barConfigs={[
                    { dataKey: 'count', fill: getChartTheme().colors[1], name: 'Count' },
                  ]}
                  height={280}
                  showGrid
                  tickAngle={-35}
                />
              ) : (
                <EmptyChart />
              )}
            </ChartPanel>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — BENCHMARK INTELLIGENCE
          ════════════════════════════════════════════════════════════════ */}
      {(globalLoading || industryTableRows.length > 0) && (
        <section>
          <DashboardSectionHeading label="INDUSTRY INTELLIGENCE" />
          <p className="-mt-4 mb-6 pl-2 text-xs text-(--color-text-muted)">
            Based on {totalScoringCalls?.toLocaleString()} total global scoring sessions · Showing
            top {industryTableRows.length} industries by volume
          </p>

          {/* Top Performer Callout */}
          {topPerformer && !globalLoading && (
            <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-(--color-border-ui) bg-transparent px-5 py-4">
              <div className="flex-1">
                <p className="mb-0.5 text-[0.625rem] font-semibold tracking-widest text-(--color-text-muted) uppercase">
                  Top Performing Industry
                </p>
                <p className="font-mono text-xl font-semibold text-(--color-text-primary)">
                  {formatIndustry(topPerformer.industry)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-3xl font-semibold text-(--color-success)">
                  {topPerformer.avgScore?.toFixed(1)}%
                </p>
                <p className="text-xs text-(--color-text-muted)">avg score</p>
              </div>
            </div>
          )}

          {/* Avg Score by Industry Benchmark Chart — use industryDistribution from log_stats */}
          {industryBarData.length > 0 && (
            <ChartPanel
              title="Avg Score by Industry (All Scoring Sessions)"
              isLoading={globalLoading}
              className="mb-6"
            >
              <BarChart
                data={industryBarData.map((r) => ({
                  name: formatIndustry(r.name),
                  score: r.avgScore ?? 0, // ← industryBarData already has avgScore via transformIndustryDistribution
                }))}
                xAxisKey="name"
                barConfigs={[
                  { dataKey: 'score', fill: getChartTheme().colors[1], name: 'Avg Score (%)' },
                ]}
                height={280}
                showGrid
                tickAngle={-35}
              />
            </ChartPanel>
          )}

          {industryTableRows.length > 0 ? (
            <div className="mt-6">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Market benchmark table">
                    <Table.Header>
                      <Table.Column
                        isRowHeader
                        className="px-3 py-2 text-left font-semibold text-(--color-text-muted)"
                      >
                        Industry
                      </Table.Column>
                      <Table.Column className="px-3 py-2 text-right font-semibold text-(--color-text-muted)">
                        Count
                      </Table.Column>
                      <Table.Column className="px-3 py-2 text-right font-semibold text-(--color-text-muted)">
                        Avg Score
                      </Table.Column>
                      <Table.Column className="px-3 py-2 text-right font-semibold text-(--color-text-muted)">
                        Share of Assessments
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {industryTableRows.map((row) => (
                        <Table.Row
                          key={row.industry}
                          className={
                            topPerformer?.industry === row.industry
                              ? 'bg-(--color-success)/5 font-medium'
                              : ''
                          }
                        >
                          <Table.Cell className="px-3 py-2 font-medium text-(--color-text-primary)">
                            {formatIndustry(row.industry)}
                          </Table.Cell>
                          <Table.Cell className="px-3 py-2 text-right text-(--color-text-muted) tabular-nums">
                            {row.count?.toLocaleString() ?? 0}
                          </Table.Cell>
                          <Table.Cell
                            className={cn(
                              'px-3 py-2 text-right tabular-nums',
                              row.avgScore >= 80
                                ? 'text-(--color-success)'
                                : row.avgScore >= 65
                                  ? 'text-(--color-text-primary)'
                                  : 'text-(--color-text-muted)',
                            )}
                          >
                            {row.avgScore !== null ? `${Number(row.avgScore).toFixed(1)}%` : '—'}
                          </Table.Cell>
                          <Table.Cell
                            className={cn(
                              'px-3 py-2 text-right tabular-nums',
                              row.share >= 20
                                ? 'text-(--color-success)'
                                : row.share >= 10
                                  ? 'text-(--color-warning)'
                                  : 'text-(--color-text-muted)',
                            )}
                          >
                            {row.share?.toFixed(1) ?? '—'}%
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
          ) : (
            <ChartPanel isLoading={globalLoading}>
              <EmptyChart />
            </ChartPanel>
          )}

          {(savedTierData.length > 0 || savedRiskData.length > 0) && (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ChartPanel title="Saved Assessments by Tier" isLoading={globalLoading}>
                {renderPieOrSingle(savedTierData, getTierColors(), 'No tier data')}
              </ChartPanel>
              <ChartPanel title="Saved Assessments by Risk" isLoading={globalLoading}>
                {renderPieOrSingle(savedRiskData, getRiskColors(), 'No risk data')}
              </ChartPanel>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — YOUR ASSESSMENTS
          ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <DashboardSectionHeading label="YOUR ASSESSMENTS" />

        {user ? (
          <>
            {/* Your stats row */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Assessments"
                value={userTotal ? userTotal.toLocaleString() : null}
                loading={userStatsLoading}
              />
              <StatCard
                title="Average Score"
                value={userAvg ? `${userAvg}%` : null}
                loading={userStatsLoading}
              />
              <StatCard
                title="Median Score"
                value={userMedian ? `${userMedian}%` : null}
                loading={userStatsLoading}
              />
              <StatCard
                title="Score Range"
                value={userMin !== null && userMax !== null ? `${userMin}% - ${userMax}%` : null}
                loading={userStatsLoading}
              />
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                title="Confidence"
                value={userConf !== null ? `${Number(userConf).toFixed(1)}%` : null}
                loading={userStatsLoading}
              />
              <StatCard
                title="Tech Feas."
                value={userTechFeas !== null ? `${Number(userTechFeas).toFixed(1)}%` : null}
                loading={userStatsLoading}
              />
              <StatCard
                title="Econ Viab."
                value={userEconViab !== null ? `${Number(userEconViab).toFixed(1)}%` : null}
                loading={userStatsLoading}
              />
              <StatCard
                title="Circularity"
                value={userCircPot !== null ? `${Number(userCircPot).toFixed(1)}%` : null}
                loading={userStatsLoading}
              />
            </div>

            <div className="space-y-8">
              {/* Your charts — each full width */}
              <ChartPanel
                title={`Your Assessments by Industry${userTotal && userIndustryData?.length ? ` (${userTotal} assessments across ${userIndustryData.length} industries)` : ''}`}
                isLoading={userStatsLoading}
                className="mb-4"
              >
                {userIndustryData.length > 0 ? (
                  <BarChart
                    data={userIndustryData}
                    xAxisKey="name"
                    barConfigs={[
                      { dataKey: 'count', fill: getChartTheme().colors[2], name: 'Count' },
                    ]}
                    height={250}
                    showGrid
                    tickAngle={-35}
                    margin={{ bottom: 80 }}
                  />
                ) : (
                  <EmptyChart />
                )}
              </ChartPanel>

              <ChartPanel title="Your Assessments by Risk" isLoading={userStatsLoading}>
                {userRiskData.length > 0 ? (
                  <PieChart
                    data={userRiskData}
                    dataKey="value"
                    nameKey="name"
                    height={250}
                    showLegend={true}
                    innerRadius={0}
                    colors={getRiskColors()}
                  />
                ) : (
                  <EmptyChart />
                )}
              </ChartPanel>
            </div>
          </>
        ) : (
          <DetailsDisplay
            variant="info"
            icon={ScrollText}
            title="Unlock Personalized Benchmark Insights"
            description="Sign in to compare your own organizational data against global industry benchmarks, track your metrics over time, and unlock unlimited circularity evaluations."
            showDefaultActions={false}
            actions={[
              {
                label: 'Sign In',
                icon: LogIn,
                variant: 'teal',
                as: Link,
                to: '/auth?view=login',
                state: { from: location },
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}

GlobalActivity.propTypes = {};
