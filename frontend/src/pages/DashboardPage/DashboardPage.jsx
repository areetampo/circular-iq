import { Table } from '@heroui/react';
import { Globe, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BarChart, LineChart, PieChart } from '@/components/charts';
import { Button } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentStats } from '@/features/assessments/hooks/useAssessmentStats';
import { useDocumentStats } from '@/features/assessments/hooks/useDocumentStats';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useGlobalStats } from '@/features/assessments/hooks/useGlobalStats';
import { useAuth } from '@/hooks/useAuth';
import {
  getRiskColors,
  getScaleColors,
  getScoreColors,
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
  usableBar,
  usablePie,
} from '@/utils/chartHelpers';
import { getChartTheme } from '@/utils/chartTheme';
import { cn } from '@/utils/cn';

import {
  ChartPanel,
  DashboardSectionHeading,
  EmptyChart,
  SingleValueChart,
  StatCard,
} from './components';

// Material colors for pie chart - factory function to resolve at render time
const getMaterialColors = () => [
  resolveCSSVar('var(--color-material-slate)', '#5a7a9a'), // muted slate blue
  resolveCSSVar('var(--chart-4)', '#8b3a3a'), // muted terracotta
  resolveCSSVar('var(--chart-2)', '#4a7c59'), // dark forest green
  resolveCSSVar('var(--color-material-ocean)', '#3a6b8b'), // ocean blue
  resolveCSSVar('var(--color-material-sage)', '#6b8b5a'), // sage
  resolveCSSVar('var(--chart-3)', '#b07d3a'), // muted amber
  resolveCSSVar('var(--chart-1)', '#b8916a'), // warm accent brown
  resolveCSSVar('var(--chart-6)', '#9a8f82'), // text muted
];

// Note: Use getMaterialColors() directly instead of Proxy export

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  // Timestamp for "Updated at" display
  const [updatedAt, setUpdatedAt] = useState(new Date());

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(undefined);
  const [categoryFilter, setCategoryFilter] = useState(undefined);
  const [industryFilter, setIndustryFilter] = useState(undefined);

  const handleSearchSubmit = useCallback(() => {
    setActiveSearch(searchQuery.trim() || undefined);
  }, [searchQuery]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setActiveSearch(undefined);
  }, []);

  // Open a single solution in the evidence drawer with full content
  const handleOpenSolution = useCallback(
    (solution) => {
      openResultsDatabaseEvidenceDetailsDrawer({
        title: solution.title || 'Solution Details',
        content: solution.problem || solution.solution || '',
        caseItem: solution, // drawer reads .problem and .solution directly
        matchPercentage: null, // no similarity context here
      });
    },
    [openResultsDatabaseEvidenceDetailsDrawer],
  );

  // ── Global data ─────────────────────────────────────────────────────────────
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
    marketDataByIndustry,
    totalSavedAssessments,
    isLoading: globalLoading,
    refetch: refetchGlobal,
  } = useGlobalStats();

  // ── User data ────────────────────────────────────────────────────────────────
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

  // ── Doc stats ─────────────────────────────────────────────────────────────────
  const { stats: docStats, loading: docLoading } = useDocumentStats();

  // Update timestamp when data finishes loading
  useEffect(() => {
    // Update timestamp when all data has finished loading
    if (!globalLoading && !userStatsLoading && !docLoading) {
      setUpdatedAt(new Date());
    }
  }, [globalLoading, userStatsLoading, docLoading]);

  // ── Featured solutions — filtered by category/industry + search ──────────────
  const { solutions: featuredSolutions, isLoading: featuredLoading } = useFeaturedSolutions({
    limit: 8,
    q: activeSearch || undefined,
    industry: industryFilter || undefined,
    enabled: true,
  });

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

  const marketTableRows = useMemo(
    () => marketDataByIndustry.filter((m) => m.industry).slice(0, 15),
    [marketDataByIndustry],
  );

  const materialData = useMemo(
    () => transformMaterialDistribution(materialDistribution, 8),
    [materialDistribution],
  );

  const geoData = useMemo(() => transformGeoDistribution(geoDistribution, 8), [geoDistribution]);

  const scaleData = useMemo(
    () => transformScaleDistribution(scaleDistribution, 6),
    [scaleDistribution],
  );

  const userIndustryData = useMemo(
    () =>
      Object.entries(userByIndustry || {})
        .map(([industry, d]) => ({
          name: industry,
          count: typeof d === 'object' ? (d.count ?? 0) : (d ?? 0),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    [userByIndustry],
  );

  const userRiskData = useMemo(
    () =>
      Object.entries(userByRisk || {}).map(([risk, count]) => ({
        name: risk.charAt(0).toUpperCase() + risk.slice(1),
        value: typeof count === 'number' ? count : 0,
      })),
    [userByRisk],
  );

  const totalDocs = useMemo(
    () => (docStats?.byIndustry || []).reduce((s, d) => s + (d.count || 0), 0),
    [docStats],
  );

  const qualityRate = junkRate != null ? (100 - junkRate).toFixed(1) : null;

  // Category chips for filtering (derived from current solutions list)
  const availableCategories = useMemo(() => {
    const cats = new Set((featuredSolutions || []).map((s) => s.category).filter(Boolean));
    return Array.from(cats);
  }, [featuredSolutions]);

  const filteredSolutions = useMemo(() => {
    if (!categoryFilter) return featuredSolutions || [];
    return (featuredSolutions || []).filter((s) => s.category === categoryFilter);
  }, [featuredSolutions, categoryFilter]);

  // ── Chart: PieChart or SingleValue fallback ──────────────────────────────────
  const renderPieOrSingle = (data, colors, emptyMsg) => {
    if (!data || data.length === 0) return <EmptyChart />;
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
        label={false}
        labelLine={false}
      />
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto mt-4 max-w-6xl space-y-12 px-4 pb-16 sm:px-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-8">
        <div>
          <h1 className="flex items-center gap-3 font-display text-[2rem] font-bold tracking-[-0.02em] text-(--color-text-primary)">
            <Globe size={28} className="text-(--color-success)" strokeWidth={2.5} />
            Global Intelligence Dashboard
          </h1>
          <p className="mt-3 text-sm/relaxed text-(--color-text-secondary)">
            Live insights from all circular economy assessments worldwide
          </p>
        </div>
        <Button onClick={refetchGlobal} disabled={globalLoading} variant="teal">
          <RefreshCw size={15} className={globalLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
          Refresh
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — SEARCH SOLUTIONS
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <DashboardSectionHeading label="SEARCH SOLUTIONS" />
        <div className="my-16 text-center text-2xl font-semibold">WIP</div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — KNOWLEDGE DATABSE STATS
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <DashboardSectionHeading label="KNOWLEDGE DATABASE STATS" />

        {/* Doc stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            title="Total Documents"
            value={totalDocs?.toLocaleString()}
            loading={docLoading}
          />
          <StatCard title="Industries" value={docStats?.byIndustry?.length} loading={docLoading} />
          <StatCard title="Sources" value={docStats?.bySources?.length} loading={docLoading} />
          <StatCard title="Categories" value={availableCategories?.length} loading={docLoading} />
        </div>

        <div className="my-16 text-center text-2xl font-semibold">WIP</div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3 — GLOBAL ACTIVITY
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <DashboardSectionHeading label="GLOBAL ACTIVITY" />

        {/* Headline 3 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Scored"
            value={totalScoringCalls?.toLocaleString()}
            subtext="All-time scoring calls"
            loading={globalLoading}
          />
          <StatCard
            title="Avg Score"
            value={avgScore ? `${avgScore}%` : null}
            subtext="Across all assessments"
            loading={globalLoading}
          />
          <StatCard
            title="Input Quality"
            value={qualityRate ? `${qualityRate}%` : null}
            subtext="non-junk inputs"
            loading={globalLoading}
          />
        </div>

        {/* Derived metrics 6-grid — SHORT labels to avoid truncation */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Confidence"
            value={avgConfidence ? `${avgConfidence}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Tech Feas."
            value={avgTechFeas ? `${avgTechFeas}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Econ Viab."
            value={avgEconViab ? `${avgEconViab}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Circularity"
            value={avgCircPot ? `${avgCircPot}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="Consistency"
            value={avgParamConsistency ? `${avgParamConsistency}%` : null}
            loading={globalLoading}
          />
          <StatCard
            title="R-Alignment"
            value={avgRAlignment ? `${avgRAlignment}%` : null}
            loading={globalLoading}
          />
        </div>

        {/* Row A: 3 donuts with single-value fallback */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ChartPanel title="Score Distribution" isLoading={globalLoading} chartHeight="250px">
            {renderPieOrSingle(scoreDistData, getScoreColors(), 'Score data unavailable')}
          </ChartPanel>
          <ChartPanel title="CE Tier Breakdown" isLoading={globalLoading} chartHeight="250px">
            {renderPieOrSingle(tierDistData, getTierColors(), 'Tier data unavailable')}
          </ChartPanel>
          <ChartPanel title="Risk Distribution" isLoading={globalLoading} chartHeight="250px">
            {renderPieOrSingle(riskDistData, getRiskColors(), 'Risk data unavailable')}
          </ChartPanel>
        </div>

        <div className="space-y-8">
          {/* Weekly trend — full width */}
          <ChartPanel
            title="Weekly Volume — last 12 weeks"
            isLoading={globalLoading}
            chartHeight="270px"
            className="mb-4"
          >
            {weeklyData.some((d) => d.count > 0) ? (
              <LineChart
                data={weeklyData}
                xAxisKey="period"
                lines={[
                  { dataKey: 'count', stroke: getChartTheme().colors[0], name: 'Assessments' },
                ]}
                height={270}
                showLegend={false}
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          {/* R-Strategy — full width */}
          <ChartPanel
            title="R-Strategy Distribution"
            isLoading={globalLoading}
            chartHeight="270px"
            className="mb-4"
          >
            {usableBar(strategyData, 'value') ? (
              <BarChart
                data={strategyData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: getChartTheme().colors[0], name: 'Count' }]}
                height={270}
                showGrid
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
              chartHeight="250px"
            >
              {usableBar(industryBarData) ? (
                <BarChart
                  data={industryBarData}
                  xAxisKey="name"
                  barConfigs={[
                    { dataKey: 'count', fill: getChartTheme().colors[1], name: 'Count' },
                  ]}
                  height={250}
                  showGrid
                />
              ) : (
                <EmptyChart />
              )}
            </ChartPanel>
          )}

          {/* Row D: Material + Geography + Scale — each full width */}
          <ChartPanel
            title="Primary Material"
            isLoading={globalLoading}
            chartHeight="230px"
            className="mb-4"
          >
            {renderPieOrSingle(materialData, getMaterialColors(), 'No material data')}
          </ChartPanel>

          <ChartPanel
            title="Geographic Focus"
            isLoading={globalLoading}
            chartHeight="230px"
            className="mb-4"
          >
            {geoData.length > 0 ? (
              <BarChart
                data={geoData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: getChartTheme().colors[2], name: 'Count' }]}
                height={230}
                showGrid
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          <ChartPanel title="Company Scale" isLoading={globalLoading} chartHeight="230px">
            {renderPieOrSingle(scaleData, getScaleColors(), 'No scale data')}
          </ChartPanel>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — BENCHMARK INTELLIGENCE
          ════════════════════════════════════════════════════════════════════ */}
      {(globalLoading || marketTableRows.length > 0) && (
        <section>
          <DashboardSectionHeading label="BENCHMARK INTELLIGENCE" />

          {marketTableRows.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Market benchmark table">
                  <Table.Header>
                    <Table.Column className="px-3 py-2 text-left font-semibold text-(--color-text-muted)">
                      Industry
                    </Table.Column>
                    <Table.Column className="px-3 py-2 text-right font-semibold text-(--color-text-muted)">
                      Count
                    </Table.Column>
                    <Table.Column className="px-3 py-2 text-right font-semibold text-(--color-text-muted)">
                      Avg Score
                    </Table.Column>
                    <Table.Column className="px-3 py-2 text-right font-semibold text-(--color-text-muted)">
                      Market Share
                    </Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {marketTableRows.map((row) => (
                      <Table.Row key={row.industry}>
                        <Table.Cell className="px-3 py-2 font-medium text-(--color-text-primary)">
                          {row.industry}
                        </Table.Cell>
                        <Table.Cell className="px-3 py-2 text-right text-(--color-text-muted) tabular-nums">
                          {row.count?.toLocaleString() ?? 0}
                        </Table.Cell>
                        <Table.Cell
                          className={cn(
                            'px-3 py-2 text-right tabular-nums',
                            row.avgScore >= 75
                              ? 'text-(--color-success)'
                              : row.avgScore >= 50
                                ? 'text-(--color-warning)'
                                : 'text-(--color-error)',
                          )}
                        >
                          {row.avgScore?.toFixed(1) ?? 0}%
                        </Table.Cell>
                        <Table.Cell className="px-3 py-2 text-right text-(--color-text-muted) tabular-nums">
                          {row.marketShare?.toFixed(1) ?? 0}%
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          ) : (
            <ChartPanel isLoading={globalLoading} chartHeight="300px">
              <EmptyChart />
            </ChartPanel>
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 5 — YOUR ASSESSMENTS
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <DashboardSectionHeading label="YOUR ASSESSMENTS" />

        {user ? (
          <>
            {/* Your stats row */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Assessments"
                value={userTotal?.toLocaleString()}
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
                value={userMin != null && userMax != null ? `${userMin}% - ${userMax}%` : null}
                loading={userStatsLoading}
              />
            </div>

            <div className="space-y-8">
              {/* Your charts — each full width */}
              <ChartPanel
                title="Your Assessments by Industry"
                isLoading={userStatsLoading}
                chartHeight="250px"
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
                  />
                ) : (
                  <EmptyChart />
                )}
              </ChartPanel>

              <ChartPanel
                title="Your Assessments by Risk"
                isLoading={userStatsLoading}
                chartHeight="250px"
              >
                {userRiskData.length > 0 ? (
                  <PieChart
                    data={userRiskData}
                    dataKey="value"
                    nameKey="name"
                    height={250}
                    showLegend={true}
                    innerRadius={0}
                    colors={getRiskColors()}
                    label={false}
                    labelLine={false}
                  />
                ) : (
                  <EmptyChart />
                )}
              </ChartPanel>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            {/* Sample charts for non-logged-in users */}
            <ChartPanel title="Your Assessments by Risk" isLoading={false} chartHeight="250px">
              <PieChart
                data={[
                  { name: 'Low Risk', value: 42 },
                  { name: 'Medium Risk', value: 38 },
                  { name: 'High Risk', value: 20 },
                ]}
                dataKey="value"
                nameKey="name"
                height={250}
                showLegend={true}
                innerRadius={0}
                colors={getRiskColors()}
              />
            </ChartPanel>
          </div>
        )}
      </section>

      {/* Updated at timestamp */}
      <div className="mt-8 text-center">
        <p className="font-mono text-sm font-medium text-(--color-text-muted)">
          Updated at {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on{' '}
          {updatedAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

DashboardPage.propTypes = {};
