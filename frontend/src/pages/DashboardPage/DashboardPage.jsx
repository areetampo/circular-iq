import { Label } from '@heroui/react';
import { BarChart3, ChevronRight, Globe, Lightbulb, RefreshCw, Search, X } from 'lucide-react';
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
  RISK_COLORS,
  SCALE_COLORS,
  SCORE_COLORS,
  TIER_COLORS,
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
import { chartTheme } from '@/utils/chartTheme';

import {
  ChartPanel,
  EmptyChart,
  SectionDivider,
  SingleValueChart,
  SolutionCard,
  StatCard,
} from './components';

// Material colors for pie chart
const MATERIAL_COLORS = [
  '#5a7a9a', // muted slate blue
  '#8b3a3a', // dark terracotta / rust
  '#4a7c59', // dark forest green
  '#b07d3a', // dark amber
  '#7a5c7a', // muted plum
  '#3a6b8b', // deep ocean blue
  '#8b5e3a', // warm brown
  '#6b8b5a', // sage green
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openDashboardFeaturedSolutionsDrawer, openResultsDatabaseEvidenceDetailsDrawer } =
    useGlobalDrawer();

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 pb-16 mt-4">
      {/* Header */}
      <div className="pt-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-(--font-display) text-[32px] text-(--color-text-primary) tracking-[-0.02em] flex items-center gap-3">
            <Globe size={28} className="text-(--color-success)" strokeWidth={2.5} />
            Global Intelligence Dashboard
          </h1>
          <p className="text-[14px] mt-3 text-(--color-text-secondary) leading-relaxed">
            Live insights from all circular economy assessments worldwide
          </p>
        </div>
        <Button onClick={refetchGlobal} disabled={globalLoading} variant="teal">
          <RefreshCw size={15} className={globalLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
          Refresh
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — GLOBAL ACTIVITY
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionDivider label="GLOBAL ACTIVITY" />

        {/* Headline 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <ChartPanel title="Score Distribution" isLoading={globalLoading} chartHeight="250px">
            {renderPieOrSingle(scoreDistData, SCORE_COLORS, 'Score data unavailable')}
          </ChartPanel>
          <ChartPanel title="CE Tier Breakdown" isLoading={globalLoading} chartHeight="250px">
            {renderPieOrSingle(tierDistData, TIER_COLORS, 'Tier data unavailable')}
          </ChartPanel>
          <ChartPanel title="Risk Distribution" isLoading={globalLoading} chartHeight="250px">
            {renderPieOrSingle(riskDistData, RISK_COLORS, 'Risk data unavailable')}
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
                lines={[{ dataKey: 'count', stroke: chartTheme.colors[0], name: 'Assessments' }]}
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
                barConfigs={[{ dataKey: 'value', fill: chartTheme.colors[0], name: 'Count' }]}
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
                  barConfigs={[{ dataKey: 'count', fill: chartTheme.colors[1], name: 'Count' }]}
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
            {renderPieOrSingle(materialData, MATERIAL_COLORS, 'No material data')}
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
                barConfigs={[{ dataKey: 'value', fill: chartTheme.colors[2], name: 'Count' }]}
                height={230}
                showGrid
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>

          <ChartPanel title="Company Scale" isLoading={globalLoading} chartHeight="230px">
            {renderPieOrSingle(scaleData, SCALE_COLORS, 'No scale data')}
          </ChartPanel>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — BENCHMARK INTELLIGENCE
          ════════════════════════════════════════════════════════════════════ */}
      {(globalLoading || marketTableRows.length > 0) && (
        <section>
          <SectionDivider label="BENCHMARK INTELLIGENCE" />

          <ChartPanel isLoading={globalLoading} chartHeight="300px">
            {marketTableRows.length > 0 ? (
              <table className="custom-data-table w-full text-xs">
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="text-left py-2 px-3 font-semibold text-(--color-text-muted)">
                      Industry
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-(--color-text-muted)">
                      Count
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-(--color-text-muted)">
                      Avg Score
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-(--color-text-muted)">
                      Market Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marketTableRows.map((row) => (
                    <tr
                      key={row.industry}
                      className="hover:bg-(--color-accent-soft) transition-colors border-b border-(--color-border)"
                    >
                      <td className="py-2 px-3 font-medium text-(--color-text-primary)">
                        {row.industry}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-(--color-text-muted)">
                        {row.count?.toLocaleString() ?? 0}
                      </td>
                      <td
                        className="py-2 px-3 text-right tabular-nums"
                        style={{
                          color:
                            row.avgScore >= 75
                              ? '#4a7c59' // muted green
                              : row.avgScore >= 50
                                ? '#b07d3a' // muted amber
                                : '#8b3a3a', // muted red
                        }}
                      >
                        {row.avgScore?.toFixed(1) ?? 0}%
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-(--color-text-muted)">
                        {row.marketShare?.toFixed(1) ?? 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3 — KNOWLEDGE BASE
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionDivider label="KNOWLEDGE DATABASE" />

        {/* Doc stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard
            title="Total Documents"
            value={totalDocs?.toLocaleString()}
            loading={docLoading}
          />
          <StatCard title="Industries" value={docStats?.byIndustry?.length} loading={docLoading} />
          <StatCard title="Sources" value={docStats?.bySources?.length} loading={docLoading} />
          <StatCard title="Categories" value={availableCategories?.length} loading={docLoading} />
        </div>

        <div className="space-y-8">
          {/* Doc distribution charts — each full width */}
          {!docLoading && docStats && (
            <>
              <ChartPanel
                title="Documents by Industry"
                isLoading={docLoading}
                chartHeight="230px"
                className="mb-4"
              >
                {docStats.byIndustry && docStats.byIndustry.length > 0 ? (
                  <BarChart
                    data={transformIndustryDistribution(docStats.byIndustry)}
                    xAxisKey="name"
                    barConfigs={[
                      { dataKey: 'value', fill: chartTheme.colors[0], name: 'Documents' },
                    ]}
                    height={230}
                    showGrid
                  />
                ) : (
                  <EmptyChart />
                )}
              </ChartPanel>

              <ChartPanel title="Documents by Material" isLoading={docLoading} chartHeight="230px">
                {docStats.byMaterial && docStats.byMaterial.length > 0 ? (
                  <BarChart
                    data={transformMaterialDistribution(docStats.byMaterial)}
                    xAxisKey="name"
                    barConfigs={[
                      { dataKey: 'value', fill: chartTheme.colors[1], name: 'Documents' },
                    ]}
                    height={230}
                    showGrid
                  />
                ) : (
                  <EmptyChart />
                )}
              </ChartPanel>
            </>
          )}

          {/* Featured Solutions */}
          <div className="rounded-xl border-2 border-[rgba(180,160,130,0.25)] bg-transparent overflow-hidden">
            {/* Header + search */}
            <div className="px-6 py-5 border-b-2 border-[rgba(180,160,130,0.18)]">
              <h3 className="font-mono text-[1.25rem] font-semibold text-(--color-text-primary) tracking-[-0.02em] mb-3 flex items-center gap-2.5">
                <Lightbulb size={16} className="text-(--color-accent)" />
                Featured Solutions
              </h3>
              <p className="text-[14px] text-(--color-text-secondary) mb-4">
                Explore successful circular economy projects and innovations
              </p>
              <div className="space-y-3">
                {/* Search bar */}
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1">
                    <Label htmlFor="solutions-search" className="sr-only">
                      Search solutions
                    </Label>
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                      aria-hidden="true"
                    />
                    <input
                      id="solutions-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      placeholder="Search solutions..."
                      className="w-full pl-10 pr-10 py-2 text-[13px] rounded-2xl focus:outline-none focus:border-[rgba(184,145,106,0.4)] focus:shadow-[0_0_0_3px_rgba(184,145,106,0.14)] transition-colors duration-150"
                      aria-label="Search featured solutions"
                      style={{
                        border: '1px solid rgba(180,160,130,0.3)',
                        backgroundColor: 'rgba(245,240,232,0.6)',
                        color: 'var(--foreground)',
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleSearchClear}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="px-4 py-2 text-[12px] font-semibold rounded-2xl transition-colors shrink-0"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    Search
                  </button>
                </div>

                {/* Category filters */}
                {availableCategories.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter(undefined)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                      style={{
                        backgroundColor: !categoryFilter
                          ? 'var(--accent)'
                          : 'rgba(245,240,232,0.8)',
                        color: !categoryFilter ? 'white' : 'var(--color-text-muted)',
                        border: '1px solid rgba(180,160,130,0.25)',
                      }}
                    >
                      All
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                        style={{
                          backgroundColor:
                            categoryFilter === cat ? 'var(--accent)' : 'rgba(245,240,232,0.8)',
                          color: categoryFilter === cat ? 'white' : 'var(--color-text-muted)',
                          border: '1px solid rgba(180,160,130,0.25)',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Solutions grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                {featuredLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-[14px] border border-[rgba(180,160,130,0.25)] p-5 space-y-3 bg-transparent"
                    >
                      <div className="h-5 w-3/4 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
                      <div className="h-4 w-full rounded-md bg-[rgba(180,160,130,0.1)] animate-pulse" />
                      <div className="h-4 w-2/3 rounded-md bg-[rgba(180,160,130,0.1)] animate-pulse" />
                      <div className="h-6 w-12 rounded-md bg-[rgba(180,160,130,0.15)] animate-pulse" />
                    </div>
                  ))
                ) : filteredSolutions?.length > 0 ? (
                  filteredSolutions.map((solution) => (
                    <SolutionCard
                      key={solution.id || solution.title}
                      title={solution.title}
                      preview={solution.solution || solution.problem || ''}
                      category={solution.category}
                      score={solution.score}
                      onView={() => handleOpenSolution(solution)}
                    />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center h-40 text-(--color-text-muted)">
                    <BarChart3 size={32} strokeWidth={1} />
                    <p className="text-[13px] font-semibold mt-2">No solutions found</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-[rgba(180,160,130,0.18)] flex items-center justify-between text-[12px]">
                <span className="text-(--color-text-muted)">
                  Showing {filteredSolutions?.length ?? 0} solutions
                </span>
                {filteredSolutions?.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      openDashboardFeaturedSolutionsDrawer({
                        q: activeSearch,
                        industry: industryFilter,
                      })
                    }
                    className="font-semibold flex items-center gap-1.5 hover:text-(--color-text-primary) transition-colors"
                    style={{
                      color: 'var(--accent)',
                    }}
                  >
                    Explore all
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — YOUR ASSESSMENTS
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionDivider label="YOUR ASSESSMENTS" />

        {user ? (
          <>
            {/* Your stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
                    barConfigs={[{ dataKey: 'count', fill: chartTheme.colors[2], name: 'Count' }]}
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
                    colors={RISK_COLORS}
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
                colors={RISK_COLORS}
              />
            </ChartPanel>
          </div>
        )}
      </section>

      {/* Updated at timestamp */}
      <div className="mt-8 text-center">
        <p className="text-sm font-medium text-(--color-text-muted) font-mono">
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
