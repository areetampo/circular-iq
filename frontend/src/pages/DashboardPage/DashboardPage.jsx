import { Skeleton } from '@heroui/react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  Gauge,
  Globe,
  Layers,
  Lightbulb,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
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
import { cn } from '@/utils/cn';

import {
  ChartPanel,
  EmptyChart,
  SectionDivider,
  SingleValueChart,
  SolutionCard,
  StatCard,
} from './components';

// ─── Colours ──────────────────────────────────────────────────────────────────
const TIER_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const RISK_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const SCORE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const SCALE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

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
    if (!data || data.length === 0) return <EmptyChart message={emptyMsg} />;
    if (!usablePie(data)) {
      return (
        <SingleValueChart
          name={data[0]?.name}
          value={data[0]?.value}
          color={colors?.[0] ?? '#10b981'}
        />
      );
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
              fontFamily: 'Lora, Georgia, serif',
            }}
          >
            <Globe size={20} style={{ color: 'var(--success)' }} strokeWidth={2.5} />
            Global Intelligence Dashboard
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{
              color: 'var(--muted)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Live insights from all circular economy assessments worldwide
          </p>
        </div>
        <button
          type="button"
          onClick={refetchGlobal}
          disabled={globalLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--muted)',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.backgroundColor = 'var(--accent-soft)';
            e.target.style.color = 'var(--foreground)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.backgroundColor = 'var(--surface)';
            e.target.style.color = 'var(--muted)';
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
        <SectionDivider
          icon={Globe}
          title="Global Activity"
          subtitle={`${totalScoringCalls.toLocaleString()} assessments scored — authenticated and anonymous`}
          accent="emerald"
        />

        {/* Headline 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <StatCard
            label="Total Scored"
            value={totalScoringCalls?.toLocaleString()}
            sub="All-time scoring calls"
            icon={Activity}
            color="emerald"
            loading={globalLoading}
          />
          <StatCard
            label="Avg Score"
            value={avgScore ? `${avgScore}%` : null}
            sub="Across all assessments"
            icon={Gauge}
            color="blue"
            loading={globalLoading}
          />
          <StatCard
            label="Input Quality"
            value={qualityRate ? `${qualityRate}%` : null}
            sub="non-junk inputs"
            icon={Shield}
            color="purple"
            loading={globalLoading}
          />
        </div>

        {/* Derived metrics 6-grid — SHORT labels to avoid truncation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard
            label="Confidence"
            value={avgConfidence ? `${avgConfidence}%` : null}
            icon={Target}
            color="indigo"
            loading={globalLoading}
          />
          <StatCard
            label="Tech Feas."
            value={avgTechFeas ? `${avgTechFeas}%` : null}
            icon={Zap}
            color="amber"
            loading={globalLoading}
          />
          <StatCard
            label="Econ Viab."
            value={avgEconViab ? `${avgEconViab}%` : null}
            icon={TrendingUp}
            color="emerald"
            loading={globalLoading}
          />
          <StatCard
            label="Circularity"
            value={avgCircPot ? `${avgCircPot}%` : null}
            icon={RefreshCw}
            color="cyan"
            loading={globalLoading}
          />
          <StatCard
            label="Consistency"
            value={avgParamConsistency ? `${avgParamConsistency}%` : null}
            icon={Layers}
            color="purple"
            loading={globalLoading}
          />
          <StatCard
            label="R-Alignment"
            value={avgRAlignment ? `${avgRAlignment}%` : null}
            icon={Sparkles}
            color="rose"
            loading={globalLoading}
          />
        </div>

        {/* Row A: 3 donuts with single-value fallback */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <ChartPanel title="Score Distribution" icon={Gauge} loading={globalLoading}>
            {renderPieOrSingle(scoreDistData, SCORE_COLORS, 'Score data unavailable')}
          </ChartPanel>
          <ChartPanel title="CE Tier Breakdown" icon={Layers} loading={globalLoading}>
            {renderPieOrSingle(tierDistData, TIER_COLORS, 'Tier data unavailable')}
          </ChartPanel>
          <ChartPanel title="Risk Distribution" icon={Shield} loading={globalLoading}>
            {renderPieOrSingle(riskDistData, RISK_COLORS, 'Risk data unavailable')}
          </ChartPanel>
        </div>

        {/* Row B: Weekly trend + R-strategy bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <ChartPanel title="Weekly Volume — last 12 weeks" icon={TrendingUp} skeleton="h-56">
            {weeklyData.some((d) => d.count > 0) ? (
              <LineChart
                data={weeklyData}
                xAxisKey="period"
                lines={[{ dataKey: 'count', stroke: '#3b82f6', name: 'Assessments' }]}
                height={220}
                showLegend={false}
              />
            ) : (
              <EmptyChart compact />
            )}
          </ChartPanel>
          <ChartPanel title="R-Strategy Distribution" icon={Sparkles} skeleton="h-56">
            {usableBar(strategyData, 'value') ? (
              <BarChart
                data={strategyData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: '#818cf8', name: 'Count' }]}
                height={220}
                showGrid
              />
            ) : (
              <EmptyChart compact />
            )}
          </ChartPanel>
        </div>

        {/* Row C: Industry bar (full width) */}
        {(globalLoading || industryBarData.length > 0) && (
          <ChartPanel
            title="Assessment Volume by Industry — top 10 (excluding uncategorized)"
            icon={Building2}
            className="mb-4"
          >
            {usableBar(industryBarData) ? (
              <BarChart
                data={industryBarData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'count', fill: '#10b981', name: 'Count' }]}
                height={220}
                showGrid
              />
            ) : (
              <EmptyChart compact />
            )}
          </ChartPanel>
        )}

        {/* Row D: Material + Geography + Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ChartPanel title="Primary Material" icon={Package} loading={globalLoading}>
            {renderPieOrSingle(materialData, undefined, 'No material data')}
          </ChartPanel>
          <ChartPanel title="Geographic Focus" icon={MapPin} loading={globalLoading}>
            {geoData.length > 0 ? (
              <BarChart
                data={geoData}
                xAxisKey="name"
                barConfigs={[{ dataKey: 'value', fill: '#06b6d4', name: 'Count' }]}
                height={200}
                showGrid
              />
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
          <ChartPanel title="Company Scale" icon={Users} loading={globalLoading}>
            {renderPieOrSingle(scaleData, SCALE_COLORS, 'No scale data')}
          </ChartPanel>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — BENCHMARK INTELLIGENCE
          ════════════════════════════════════════════════════════════════════ */}
      {(globalLoading || marketTableRows.length > 0) && (
        <section>
          <SectionDivider
            icon={BarChart3}
            title="Benchmark Intelligence"
            subtitle="Industry averages from contributed assessments"
            accent="blue"
          />

          <ChartPanel loading={globalLoading} className="overflow-x-auto">
            {marketTableRows.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Industry</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Count</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Avg Score</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">
                      Market Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marketTableRows.map((row) => (
                    <tr key={row.industry} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-900 font-medium">{row.industry}</td>
                      <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                        {row.count?.toLocaleString() ?? 0}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                        {row.average_score ? `${row.average_score}%` : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                        {row.market_share ? `${row.market_share}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyChart message="No benchmark data available yet" />
            )}
          </ChartPanel>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3 — KNOWLEDGE BASE
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionDivider
          icon={BookOpen}
          title="Knowledge Base"
          subtitle="Featured circular economy solutions and insights"
          accent="indigo"
        />

        {/* Doc stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total Documents"
            value={totalDocs?.toLocaleString()}
            icon={BookOpen}
            color="indigo"
            loading={docLoading}
          />
          <StatCard
            label="Industries"
            value={docStats?.byIndustry?.length}
            icon={Building2}
            color="purple"
            loading={docLoading}
          />
          <StatCard
            label="Sources"
            value={docStats?.bySources?.length}
            icon={Package}
            color="amber"
            loading={docLoading}
          />
          <StatCard
            label="Categories"
            value={availableCategories?.length}
            icon={Layers}
            color="cyan"
            loading={docLoading}
          />
        </div>

        {/* Doc distribution charts */}
        {!docLoading && docStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <ChartPanel title="Documents by Industry" icon={Building2}>
              {docStats.byIndustry && docStats.byIndustry.length > 0 ? (
                <BarChart
                  data={docStats.byIndustry
                    .filter((d) => d.industry && d.industry !== 'unknown')
                    .slice(0, 8)
                    .map((d) => ({ name: d.industry, count: d.count }))}
                  xAxisKey="name"
                  barConfigs={[{ dataKey: 'count', fill: '#6366f1', name: 'Count' }]}
                  height={180}
                  showGrid
                />
              ) : (
                <EmptyChart compact />
              )}
            </ChartPanel>
            <ChartPanel title="Documents by Source" icon={Package}>
              {docStats.bySources && docStats.bySources.length > 0 ? (
                <BarChart
                  data={docStats.bySources
                    .slice(0, 8)
                    .map((d) => ({ name: d.source, count: d.count }))}
                  xAxisKey="name"
                  barConfigs={[{ dataKey: 'count', fill: '#8b5cf6', name: 'Count' }]}
                  height={180}
                  showGrid
                />
              ) : (
                <EmptyChart compact />
              )}
            </ChartPanel>
          </div>
        )}

        {/* ── Featured Solutions ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Header + search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-500" />
              Featured Solutions
            </h3>
            <div className="space-y-3">
              {/* Search bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Search solutions..."
                    className="w-full pl-9 pr-9 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleSearchClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
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
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium transition-all',
                      !categoryFilter
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    All
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-medium transition-all',
                        categoryFilter === cat
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-56">
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
                    solution={solution}
                    onOpen={handleOpenSolution}
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
                  className="font-medium flex items-center gap-1"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--foreground)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--accent)';
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
          <SectionDivider
            icon={Users}
            title="Your Assessments"
            subtitle="Your personal circular economy evaluation history"
            accent="indigo"
          />

          {/* Your stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Total Assessments"
              value={userTotal?.toLocaleString()}
              icon={Activity}
              color="indigo"
              loading={userStatsLoading}
            />
            <StatCard
              label="Average Score"
              value={userAvg ? `${userAvg}%` : null}
              icon={Gauge}
              color="blue"
              loading={userStatsLoading}
            />
            <StatCard
              label="Median Score"
              value={userMedian ? `${userMedian}%` : null}
              icon={Target}
              color="purple"
              loading={userStatsLoading}
            />
            <StatCard
              label="Score Range"
              value={userMin != null && userMax != null ? `${userMin}% - ${userMax}%` : null}
              icon={TrendingUp}
              color="emerald"
              loading={userStatsLoading}
            />
          </div>

          {/* Your charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartPanel title="Your Assessments by Industry" icon={Building2} skeleton="h-56">
              {userIndustryData.length > 0 ? (
                <BarChart
                  data={userIndustryData}
                  xAxisKey="name"
                  barConfigs={[{ dataKey: 'count', fill: '#a78bfa', name: 'Count' }]}
                  height={220}
                  showGrid
                />
              ) : (
                <EmptyChart compact />
              )}
            </ChartPanel>

            <ChartPanel title="Your Assessments by Risk" icon={Shield} skeleton="h-56">
              {renderPieOrSingle(userRiskData, RISK_COLORS, 'No risk data available')}
            </ChartPanel>
          </div>
        </section>
      ) : (
        <div
          className="rounded-xl border p-6 flex flex-col sm:flex-row items-center gap-4"
          style={{
            background: 'linear-gradient(to right, var(--accent-soft), var(--surface))',
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
                fontFamily: 'Lora, Georgia, serif',
              }}
            >
              Track Your Progress
            </h3>
            <p
              className="text-xs"
              style={{
                color: 'var(--muted)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Sign in to save assessments, track your evaluation history, and compare with global
              benchmarks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="px-4 py-2 text-xs font-medium rounded-lg transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--surface)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--accent)';
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
