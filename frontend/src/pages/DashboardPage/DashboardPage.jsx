import { Skeleton } from '@heroui/react';
import {
  BarChart3,
  ChevronRight,
  Globe,
  Lightbulb,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BarChart, LineChart, PieChart } from '@/components/charts';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentStats } from '@/features/assessments/hooks/useAssessmentStats';
import { useDocumentStats } from '@/features/assessments/hooks/useDocumentStats';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useGlobalStats } from '@/features/assessments/hooks/useGlobalStats';
import { useAuth } from '@/hooks/useAuth';

import {
  ChartPanel,
  EmptyChart,
  SectionDivider,
  SingleValueChart,
  SolutionCard,
  StatCard,
} from './components';

// ─── Colours ──────────────────────────────────────────────────────────────────
const TIER_COLORS = [
  'var(--success)',
  'var(--info)',
  'var(--warning)',
  'var(--danger)',
  'var(--muted)',
];
const RISK_COLORS = ['var(--success)', 'var(--warning)', 'var(--danger)', 'var(--muted)'];
const SCORE_COLORS = ['var(--danger)', 'var(--warning)', 'var(--info)', 'var(--success)'];
const SCALE_COLORS = [
  'var(--danger)',
  'var(--warning)',
  'var(--info)',
  'var(--success)',
  'var(--accent)',
  'var(--muted)',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Only show a PieChart when we have ≥ 2 distinct values with total ≥ 2 */
function usablePie(data) {
  if (!data || data.length < 2) return false;
  const total = data.reduce((s, d) => s + (d.value ?? 0), 0);
  return total >= 2;
}

/** Only show a BarChart when we have ≥ 1 bar with count/value > 0 */
function usableBar(data, key = 'count') {
  return data && data.length > 0 && data.some((d) => (d[key] ?? 0) > 0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openDashboardFeaturedSolutionsDrawer, openResultsDatabaseEvidenceDetailsDrawer } =
    useGlobalDrawer();

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

  // ── Featured solutions — filtered by category/industry + search ──────────────
  const { solutions: featuredSolutions, isLoading: featuredLoading } = useFeaturedSolutions({
    limit: 8,
    q: activeSearch || undefined,
    industry: industryFilter || undefined,
    enabled: true,
  });

  // ── Chart data (all memoised) ─────────────────────────────────────────────────

  const scoreDistData = useMemo(
    () =>
      Object.entries(scoreDistribution)
        .map(([name, count]) => ({ name, value: Number(count) }))
        .filter((d) => d.value > 0),
    [scoreDistribution],
  );

  const tierDistData = useMemo(
    () =>
      Object.entries(tierDistribution)
        .filter(([t]) => t && t !== 'Unknown')
        .map(([tier, count]) => ({ name: tier, value: Number(count) }))
        .sort((a, b) => b.value - a.value),
    [tierDistribution],
  );

  const riskDistData = useMemo(
    () =>
      Object.entries(riskDistribution)
        .filter(([r]) => r && r !== 'unknown')
        .map(([risk, count]) => ({
          name: risk.charAt(0).toUpperCase() + risk.slice(1),
          value: Number(count),
        })),
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
    () =>
      industryDistribution
        .filter((d) => d.industry && d.industry !== 'other' && d.industry !== 'general')
        .slice(0, 10)
        .map((d) => ({ name: d.industry, count: Number(d.count) })),
    [industryDistribution],
  );

  const weeklyData = useMemo(
    () =>
      weeklyTrend.map((w) => ({
        period: w.week,
        count: Number(w.count),
        averageScore: w.avg_score != null ? Number(w.avg_score) : 0,
      })),
    [weeklyTrend],
  );

  const marketTableRows = useMemo(
    () => marketDataByIndustry.filter((m) => m.industry).slice(0, 15),
    [marketDataByIndustry],
  );

  const materialData = useMemo(
    () =>
      (materialDistribution || [])
        .filter((d) => d.material && d.material !== 'unknown')
        .slice(0, 8)
        .map((d) => ({ name: d.material, value: Number(d.count) })),
    [materialDistribution],
  );

  const geoData = useMemo(
    () =>
      (geoDistribution || [])
        .filter((d) => d.geo && d.geo !== 'unknown')
        .slice(0, 8)
        .map((d) => ({ name: d.geo, value: Number(d.count) })),
    [geoDistribution],
  );

  const scaleData = useMemo(
    () =>
      (scaleDistribution || [])
        .filter((d) => d.scale && d.scale !== 'unknown')
        .slice(0, 6)
        .map((d) => ({ name: d.scale, value: Number(d.count) })),
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
    if (!usablePie(data)) {
      return <SingleValueChart label={data[0]?.name} value={data[0]?.value} />;
    }
    return (
      <PieChart
        data={data}
        dataKey="value"
        nameKey="name"
        height={200}
        showLegend
        innerRadius={40}
        colors={colors}
      />
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 pb-16">
      {/* Header */}
      <div className="pt-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold flex items-center gap-2"
            style={{
              color: 'var(--foreground)',
            }}
          >
            <Globe size={20} style={{ color: 'var(--success)' }} strokeWidth={2.5} />
            Global Intelligence Dashboard
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{
              color: 'var(--muted)',
            }}
          >
            Live insights from all circular economy assessments worldwide
          </p>
        </div>
        <button
          type="button"
          onClick={refetchGlobal}
          disabled={globalLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--muted)',
          }}
        >
          <RefreshCw size={12} className={globalLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
          Refresh
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — GLOBAL ACTIVITY
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionDivider label="GLOBAL ACTIVITY" />

        {/* Headline 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <ChartPanel title="Score Distribution" isLoading={globalLoading} chartHeight="192px">
            {renderPieOrSingle(scoreDistData, SCORE_COLORS, 'Score data unavailable')}
          </ChartPanel>
          <ChartPanel title="CE Tier Breakdown" isLoading={globalLoading} chartHeight="192px">
            {renderPieOrSingle(tierDistData, TIER_COLORS, 'Tier data unavailable')}
          </ChartPanel>
          <ChartPanel title="Risk Distribution" isLoading={globalLoading} chartHeight="192px">
            {renderPieOrSingle(riskDistData, RISK_COLORS, 'Risk data unavailable')}
          </ChartPanel>
        </div>

        {/* Weekly trend — full width */}
        <ChartPanel
          title="Weekly Volume — last 12 weeks"
          isLoading={globalLoading}
          chartHeight="240px"
          className="mb-4"
        >
          {weeklyData.some((d) => d.count > 0) ? (
            <LineChart
              data={weeklyData}
              xAxisKey="period"
              lines={[{ dataKey: 'count', stroke: 'var(--info)', name: 'Assessments' }]}
              height={240}
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
          chartHeight="240px"
          className="mb-4"
        >
          {usableBar(strategyData, 'value') ? (
            <BarChart
              data={strategyData}
              xAxisKey="name"
              barConfigs={[{ dataKey: 'value', fill: 'var(--accent)', name: 'Count' }]}
              height={240}
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
            chartHeight="220px"
          >
            {usableBar(industryBarData) ? (
              <BarChart
                data={industryBarData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'count', fill: 'var(--secondary)', name: 'Count' }]}
                height={220}
                showGrid
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
        )}

        {/* Row D: Material + Geography + Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ChartPanel title="Primary Material" isLoading={globalLoading} chartHeight="192px">
            {renderPieOrSingle(materialData, undefined, 'No material data')}
          </ChartPanel>
          <ChartPanel title="Geographic Focus" isLoading={globalLoading} chartHeight="192px">
            {geoData.length > 0 ? (
              <BarChart
                data={geoData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: 'var(--success)', name: 'Count' }]}
                height={200}
                showGrid
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
          <ChartPanel title="Company Scale" isLoading={globalLoading} chartHeight="192px">
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
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th
                      className="text-left py-2 px-3 font-semibold"
                      style={{ color: 'var(--muted)' }}
                    >
                      Industry
                    </th>
                    <th
                      className="text-right py-2 px-3 font-semibold"
                      style={{ color: 'var(--muted)' }}
                    >
                      Count
                    </th>
                    <th
                      className="text-right py-2 px-3 font-semibold"
                      style={{ color: 'var(--muted)' }}
                    >
                      Avg Score
                    </th>
                    <th
                      className="text-right py-2 px-3 font-semibold"
                      style={{ color: 'var(--muted)' }}
                    >
                      Market Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marketTableRows.map((row) => (
                    <tr
                      key={row.industry}
                      className="hover:bg-[var(--accent-soft)] transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="py-2 px-3 font-medium" style={{ color: 'var(--foreground)' }}>
                        {row.industry}
                      </td>
                      <td
                        className="py-2 px-3 text-right tabular-nums"
                        style={{ color: 'var(--muted)' }}
                      >
                        {row.count?.toLocaleString() ?? 0}
                      </td>
                      <td
                        className="py-2 px-3 text-right tabular-nums"
                        style={{ color: 'var(--muted)' }}
                      >
                        {row.average_score ? `${row.average_score}%` : '—'}
                      </td>
                      <td
                        className="py-2 px-3 text-right tabular-nums"
                        style={{ color: 'var(--muted)' }}
                      >
                        {row.market_share ? `${row.market_share}%` : '—'}
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
        <SectionDivider label="KNOWLEDGE BASE" />

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

        {/* Doc distribution charts */}
        {!docLoading && docStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <ChartPanel title="Documents by Industry" isLoading={docLoading} chartHeight="180px">
              {docStats.byIndustry && docStats.byIndustry.length > 0 ? (
                <BarChart
                  data={docStats.byIndustry
                    .filter((d) => d.industry && d.industry !== 'unknown')
                    .slice(0, 8)
                    .map((d) => ({ name: d.industry, count: d.count }))}
                  xAxisKey="name"
                  barConfigs={[{ dataKey: 'count', fill: 'var(--chart-1)', name: 'Count' }]}
                  height={180}
                  showGrid
                />
              ) : (
                <EmptyChart />
              )}
            </ChartPanel>
            <ChartPanel title="Documents by Source" isLoading={docLoading} chartHeight="180px">
              {docStats.bySources && docStats.bySources.length > 0 ? (
                <BarChart
                  data={docStats.bySources
                    .slice(0, 8)
                    .map((d) => ({ name: d.source, count: d.count }))}
                  xAxisKey="name"
                  barConfigs={[{ dataKey: 'count', fill: 'var(--chart-2)', name: 'Count' }]}
                  height={180}
                  showGrid
                />
              ) : (
                <EmptyChart />
              )}
            </ChartPanel>
          </div>
        )}

        {/* ── Featured Solutions ───────────────────────────────────────────── */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
        >
          {/* Header + search */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'var(--foreground)' }}
            >
              <Lightbulb size={14} style={{ color: 'var(--accent)' }} />
              Featured Solutions
            </h3>
            <div className="space-y-3">
              {/* Search bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Search solutions..."
                    className="w-full pl-9 pr-9 py-1.5 text-sm rounded-lg focus:outline-none"
                    style={{
                      border: '1px solid var(--field-border)',
                      backgroundColor: 'var(--field-bg)',
                      color: 'var(--foreground)',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleSearchClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--muted)' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  Search
                </button>
              </div>

              {/* Category filters */}
              {availableCategories.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter(undefined)}
                    className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
                    style={{
                      backgroundColor: !categoryFilter ? 'var(--accent)' : 'var(--surface)',
                      color: !categoryFilter ? 'white' : 'var(--muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    All
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
                      style={{
                        backgroundColor:
                          categoryFilter === cat ? 'var(--accent)' : 'var(--surface)',
                        color: categoryFilter === cat ? 'white' : 'var(--muted)',
                        border: '1px solid var(--border)',
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
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-4 space-y-3"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--surface)',
                    }}
                  >
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                ))
              ) : filteredSolutions?.length > 0 ? (
                filteredSolutions.map((solution) => (
                  <SolutionCard
                    key={solution.id || solution.title}
                    title={solution.title}
                    preview={solution.solution || solution.problem || ''}
                    category={solution.category}
                    onView={() => handleOpenSolution(solution)}
                  />
                ))
              ) : (
                <div
                  className="col-span-full flex flex-col items-center justify-center h-40"
                  style={{ color: 'var(--muted)' }}
                >
                  <BarChart3 size={32} strokeWidth={1} />
                  <p className="text-sm font-medium mt-2">No solutions found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="mt-4 pt-4 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--border)' }}
            >
              <span style={{ color: 'var(--muted)' }}>
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
                  className="font-medium flex items-center gap-1 hover:text-[var(--foreground)]"
                  style={{
                    color: 'var(--accent)',
                  }}
                >
                  Explore all
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — YOUR ASSESSMENTS
          ════════════════════════════════════════════════════════════════════ */}
      {user ? (
        <section>
          <SectionDivider label="YOUR ASSESSMENTS" />

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

          {/* Your charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartPanel
              title="Your Assessments by Industry"
              isLoading={userStatsLoading}
              chartHeight="220px"
            >
              {userIndustryData.length > 0 ? (
                <BarChart
                  data={userIndustryData}
                  xAxisKey="name"
                  barConfigs={[{ dataKey: 'count', fill: 'var(--chart-3)', name: 'Count' }]}
                  height={220}
                  showGrid
                />
              ) : (
                <EmptyChart />
              )}
            </ChartPanel>

            <ChartPanel
              title="Your Assessments by Risk"
              isLoading={userStatsLoading}
              chartHeight="220px"
            >
              {renderPieOrSingle(userRiskData, RISK_COLORS, 'No risk data available')}
            </ChartPanel>
          </div>
        </section>
      ) : (
        <div
          className="rounded-xl border p-6 flex flex-col sm:flex-row items-center gap-4"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          >
            <Users size={18} strokeWidth={2} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1">
            <h3
              className="font-semibold mb-0.5"
              style={{
                color: 'var(--foreground)',
              }}
            >
              Track Your Progress
            </h3>
            <p
              className="text-xs"
              style={{
                color: 'var(--muted)',
              }}
            >
              Sign in to save assessments, track your evaluation history, and compare with global
              benchmarks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="px-4 py-2 text-xs font-medium rounded-lg transition-colors shrink-0 hover:bg-[var(--foreground)]"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--surface)',
            }}
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}

DashboardPage.propTypes = {};
