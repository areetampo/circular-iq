import { Skeleton } from '@heroui/react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  ExternalLink,
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
import { useAssessmentStats, useDocumentStats, useGlobalStats } from '@/features/assessments';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

// ─── Color palettes ───────────────────────────────────────────────────────────
const TIER_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const RISK_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const SCORE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const STRATEGY_FILL = '#818cf8';
const INDUSTRY_FILL = '#10b981';
const MATERIAL_FILL = '#f59e0b';
const GEO_FILL = '#06b6d4';
const SCALE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
const USER_IND_FILL = '#a78bfa';

// ─── ICON_CLS map ─────────────────────────────────────────────────────────────
const ICON_CLS = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  teal: 'bg-teal-50 text-teal-600',
  cyan: 'bg-cyan-50 text-cyan-600',
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color = 'emerald', loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5">
        <Skeleton className="h-2.5 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded" />
        {sub !== undefined && <Skeleton className="h-2.5 w-24 rounded-full" />}
      </div>
    );
  }
  const iconCls = ICON_CLS[color] ?? 'bg-slate-50 text-slate-600';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">
            {value ?? '—'}
          </p>
          {sub && <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconCls)}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────
function SectionDivider({ icon: Icon, title, subtitle, accent = 'emerald' }) {
  const bar =
    {
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500',
      indigo: 'bg-indigo-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500',
      cyan: 'bg-cyan-500',
    }[accent] ?? 'bg-slate-400';
  const iconCls = ICON_CLS[accent] ?? 'bg-slate-100 text-slate-600';
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: bar }} />
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconCls)}
          >
            <Icon size={15} strokeWidth={2} />
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── ChartPanel ───────────────────────────────────────────────────────────────
function ChartPanel({
  title,
  icon: Icon,
  iconColor = 'text-slate-400',
  loading,
  skeleton = 'h-44',
  children,
  className,
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden', className)}>
      {title && (
        <div className="px-4 pt-3.5 pb-1 flex items-center gap-2 border-b border-slate-50">
          {Icon && <Icon size={13} className={iconColor} strokeWidth={2.5} />}
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            {title}
          </span>
        </div>
      )}
      <div className="p-3">
        {loading ? (
          <div className="px-1">
            <Skeleton className={cn('w-full rounded-lg', skeleton)} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ message = 'No data yet', compact }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center text-slate-300 text-xs font-medium',
        compact ? 'h-24' : 'h-36',
      )}
    >
      {message}
    </div>
  );
}

// ─── Solution detail modal (inline, no drawer dependency) ─────────────────────
function SolutionModal({ solution, onClose }) {
  if (!solution) return null;
  const text = solution.solution || solution.problem || '';
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {solution.title?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {solution.title || 'Untitled'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{solution.category || 'Solution'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {solution.problem && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" />
                Problem
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{solution.problem}</p>
            </div>
          )}
          {solution.solution && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                <Target size={14} className="text-emerald-500" />
                Solution
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{solution.solution}</p>
            </div>
          )}
          {!solution.problem && !solution.solution && text && (
            <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Source:{' '}
            {solution.source || (solution.sourceId ? `#${solution.sourceId}` : 'Knowledge base')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SolutionCard ────────────────────────────────────────────────────────────
function SolutionCard({ solution, onOpen }) {
  const preview = (solution.solution || solution.problem || '').slice(0, 100);
  const initial = (solution.title || 'S').charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={() => onOpen(solution)}
      className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-indigo-200 transition-colors">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-indigo-700 transition-colors">
            {solution.title || 'Untitled'}
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
            {preview || 'Click to view details'}
            {preview.length === 100 && '…'}
          </p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {solution.category && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                {solution.category}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-slate-300 group-hover:text-indigo-400 transition-colors">
        <span className="text-[10px] font-semibold">View details</span>
        <ChevronRight size={10} />
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openDashboardFeaturedSolutionsDrawer } = useGlobalDrawer();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(undefined);
  const [selectedSolution, setSelectedSolution] = useState(null);

  const handleSearchSubmit = useCallback(() => {
    setActiveSearch(searchQuery.trim() || undefined);
  }, [searchQuery]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setActiveSearch(undefined);
  }, []);

  // ── Data hooks ──────────────────────────────────────────────────────────────
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

  const { stats: docStats, loading: docLoading } = useDocumentStats();

  const { solutions: featuredSolutions, isLoading: featuredLoading } = useFeaturedSolutions({
    limit: 4,
    q: activeSearch,
    enabled: true,
  });

  // ── Chart data ──────────────────────────────────────────────────────────────
  const scoreDistData = useMemo(
    () =>
      Object.entries(scoreDistribution)
        .map(([range, count]) => ({ name: range, value: Number(count) }))
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

  // Industry: filter out 'general' and 'other' — they're catch-all categories
  // that swamp the chart and carry no actionable information
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Solution detail modal */}
      {selectedSolution && (
        <SolutionModal solution={selectedSolution} onClose={() => setSelectedSolution(null)} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 pb-16">
        {/* Page header */}
        <div className="pt-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-slate-600" />
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Global circular economy insights and your assessment activity
            </p>
          </div>
          <button
            type="button"
            onClick={refetchGlobal}
            disabled={globalLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-40"
          >
            <RefreshCw
              size={12}
              className={cn('transition-transform', globalLoading && 'animate-spin')}
            />
            Refresh
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — GLOBAL ACTIVITY
            ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionDivider
            icon={Globe}
            title="Global Activity"
            subtitle="Aggregate insights from all circular economy assessments"
            accent="emerald"
          />

          {/* Row 1: headline trio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <StatCard
              label="Total Assessments"
              value={totalScoringCalls?.toLocaleString()}
              sub="All-time scoring calls"
              icon={Activity}
              color="emerald"
              loading={globalLoading}
            />
            <StatCard
              label="Average Score"
              value={avgScore ? `${avgScore}%` : null}
              sub="Across all assessments"
              icon={Gauge}
              color="blue"
              loading={globalLoading}
            />
            <StatCard
              label="Input Quality"
              value={qualityRate ? `${qualityRate}%` : null}
              sub="Valid assessments"
              icon={Shield}
              color="purple"
              loading={globalLoading}
            />
          </div>

          {/* Row 2: 6 derived metric averages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard
              label="Confidence"
              value={avgConfidence ? `${avgConfidence}%` : null}
              icon={Target}
              color="indigo"
              loading={globalLoading}
            />
            <StatCard
              label="Technical Feasibility"
              value={avgTechFeas ? `${avgTechFeas}%` : null}
              icon={Zap}
              color="amber"
              loading={globalLoading}
            />
            <StatCard
              label="Economic Viability"
              value={avgEconViab ? `${avgEconViab}%` : null}
              icon={TrendingUp}
              color="emerald"
              loading={globalLoading}
            />
            <StatCard
              label="Circularity Potential"
              value={avgCircPot ? `${avgCircPot}%` : null}
              icon={RefreshCw}
              color="cyan"
              loading={globalLoading}
            />
            <StatCard
              label="Parameter Consistency"
              value={avgParamConsistency ? `${avgParamConsistency}%` : null}
              icon={Layers}
              color="purple"
              loading={globalLoading}
            />
            <StatCard
              label="R-Strategy Alignment"
              value={avgRAlignment ? `${avgRAlignment}%` : null}
              icon={Sparkles}
              color="rose"
              loading={globalLoading}
            />
          </div>

          {/* Row 3: 3 distribution donuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <ChartPanel
              title="Score Distribution"
              icon={Gauge}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {scoreDistData.length > 0 ? (
                <PieChart
                  data={scoreDistData}
                  colors={SCORE_COLORS}
                  innerRadius={40}
                  outerRadius={80}
                  showLabels={false}
                  showLegend
                  legendPosition="bottom"
                  height={200}
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>

            <ChartPanel
              title="Circular Economy Tiers"
              icon={Layers}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {tierDistData.length > 0 ? (
                <PieChart
                  data={tierDistData}
                  colors={TIER_COLORS}
                  innerRadius={40}
                  outerRadius={80}
                  showLabels={false}
                  showLegend
                  legendPosition="bottom"
                  height={200}
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>

            <ChartPanel
              title="Risk Levels"
              icon={Shield}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {riskDistData.length > 0 ? (
                <PieChart
                  data={riskDistData}
                  colors={RISK_COLORS}
                  innerRadius={40}
                  outerRadius={80}
                  showLabels={false}
                  showLegend
                  legendPosition="bottom"
                  height={200}
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>
          </div>

          {/* Row 4: Weekly trend + R-strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <ChartPanel
              title="Assessment Activity (12 weeks)"
              icon={TrendingUp}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {weeklyData.length > 0 ? (
                <LineChart
                  data={weeklyData}
                  xKey="period"
                  yKeys={['count']}
                  colors={['#3b82f6']}
                  height={200}
                  showGrid
                  showDots
                  yAxisLabel="Assessments"
                  xAxisLabel="Week"
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>

            <ChartPanel
              title="R-Strategy Distribution"
              icon={Sparkles}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {strategyData.length > 0 ? (
                <BarChart
                  data={strategyData}
                  xKey="name"
                  yKey="value"
                  fill={STRATEGY_FILL}
                  height={200}
                  showGrid
                  truncateLabels
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>
          </div>

          {/* Row 5: Industry + Material + Geo + Scale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ChartPanel
              title="Industry Distribution (excluding uncategorized)"
              icon={Building2}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {industryBarData.length > 0 ? (
                <BarChart
                  data={industryBarData}
                  xKey="name"
                  yKey="count"
                  fill={INDUSTRY_FILL}
                  height={200}
                  showGrid
                  truncateLabels
                  horizontal
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>

            <ChartPanel
              title="Primary Material"
              icon={Package}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {materialData.length > 0 ? (
                <BarChart
                  data={materialData}
                  xKey="name"
                  yKey="value"
                  fill={MATERIAL_FILL}
                  height={200}
                  showGrid
                  truncateLabels
                  horizontal
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>

            <ChartPanel
              title="Geographic Focus"
              icon={MapPin}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {geoData.length > 0 ? (
                <BarChart
                  data={geoData}
                  xKey="name"
                  yKey="value"
                  fill={GEO_FILL}
                  height={200}
                  showGrid
                  truncateLabels
                  horizontal
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>

            <ChartPanel
              title="Company Scale"
              icon={Users}
              iconColor="text-slate-400"
              loading={globalLoading}
            >
              {scaleData.length > 0 ? (
                <PieChart
                  data={scaleData}
                  colors={SCALE_COLORS}
                  innerRadius={30}
                  outerRadius={70}
                  showLabels={false}
                  showLegend
                  legendPosition="bottom"
                  height={200}
                />
              ) : (
                <EmptyState />
              )}
            </ChartPanel>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — BENCHMARK INTELLIGENCE
            ══════════════════════════════════════════════════════════════════ */}
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
                      <th className="text-right py-2 px-3 font-semibold text-slate-600">
                        Avg Score
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-600">
                        Market Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketTableRows.map((row) => (
                      <tr
                        key={row.industry}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
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
                <EmptyState message="No benchmark data available yet" />
              )}
            </ChartPanel>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — KNOWLEDGE BASE
            ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionDivider
            icon={BookOpen}
            title="Knowledge Base"
            subtitle="Featured circular economy solutions and insights"
            accent="purple"
          />

          {/* Search bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
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
                className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Solutions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {featuredLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              ))
            ) : featuredSolutions?.length > 0 ? (
              featuredSolutions.map((solution) => (
                <SolutionCard
                  key={solution.id || solution.title}
                  solution={solution}
                  onOpen={setSelectedSolution}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState message="No solutions found for your search" />
              </div>
            )}
          </div>

          {/* Explore all link */}
          {featuredSolutions?.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => openDashboardFeaturedSolutionsDrawer({ q: activeSearch })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <ExternalLink size={14} />
                Explore all solutions
              </button>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — YOUR ASSESSMENTS (auth only)
            ══════════════════════════════════════════════════════════════════ */}
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
              <ChartPanel
                title="Your Assessments by Industry"
                icon={Building2}
                iconColor="text-slate-400"
                loading={userStatsLoading}
              >
                {userIndustryData.length > 0 ? (
                  <BarChart
                    data={userIndustryData}
                    xKey="name"
                    yKey="count"
                    fill={USER_IND_FILL}
                    height={200}
                    showGrid
                    truncateLabels
                    horizontal
                  />
                ) : (
                  <EmptyState compact />
                )}
              </ChartPanel>

              <ChartPanel
                title="Your Assessments by Risk"
                icon={Shield}
                iconColor="text-slate-400"
                loading={userStatsLoading}
              >
                {userRiskData.length > 0 ? (
                  <PieChart
                    data={userRiskData}
                    colors={RISK_COLORS}
                    innerRadius={40}
                    outerRadius={80}
                    showLabels={false}
                    showLegend
                    legendPosition="bottom"
                    height={200}
                  />
                ) : (
                  <EmptyState compact />
                )}
              </ChartPanel>
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-linear-to-r from-purple-50 via-white to-white p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Track Your Progress</h3>
              <p className="text-sm text-slate-600">
                Sign in to save assessments, track your evaluation history, and compare with global
                benchmarks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shrink-0"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </>
  );
}
