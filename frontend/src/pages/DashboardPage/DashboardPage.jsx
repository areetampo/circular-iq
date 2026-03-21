import { Card, Chip, Input, Skeleton } from '@heroui/react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  Gauge,
  Globe,
  Layers,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BarChart, LineChart, PieChart } from '@/components/charts';
import { Button } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAssessmentStats, useDocumentStats, useGlobalStats } from '@/features/assessments';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

// ─── Reusable small components ────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = 'emerald', loading }) {
  const iconCls =
    {
      emerald: 'bg-emerald-50 text-emerald-600',
      blue: 'bg-blue-50 text-blue-600',
      purple: 'bg-purple-50 text-purple-600',
      amber: 'bg-amber-50 text-amber-600',
      rose: 'bg-rose-50 text-rose-600',
      indigo: 'bg-indigo-50 text-indigo-600',
    }[color] ?? 'bg-slate-50 text-slate-600';

  if (loading) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <div className="p-5 space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-8 w-14 rounded" />
          <Skeleton className="h-3 w-28 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 truncate">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-900 leading-none">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg', iconCls)}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconCls = 'text-emerald-600' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn('p-2 rounded-lg bg-slate-100', iconCls)}>
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, icon: Icon, iconCls, loading, children, height = 'h-48' }) {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <div className="p-4">
        {title && (
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            {Icon && <Icon size={15} className={iconCls ?? 'text-slate-500'} />}
            {title}
          </h3>
        )}
        {loading ? <Skeleton className={cn('w-full rounded', height)} /> : children}
      </div>
    </Card>
  );
}

function EmptyChart({ message = 'No data yet' }) {
  return (
    <div className="h-40 flex items-center justify-center text-slate-400 text-sm">{message}</div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openDashboardFeaturedSolutionsDrawer } = useGlobalDrawer();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(undefined);

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
    marketDataByIndustry,
    totalSavedAssessments,
    assessmentsByTier,
    assessmentsByRisk,
    assessmentsByScale,
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
      Object.entries(scoreDistribution).map(([range, count]) => ({ name: range, value: count })),
    [scoreDistribution],
  );

  const tierDistData = useMemo(
    () =>
      Object.entries(tierDistribution)
        .filter(([t]) => t !== 'Unknown')
        .map(([tier, count]) => ({ name: tier, value: count }))
        .sort((a, b) => b.value - a.value),
    [tierDistribution],
  );

  const riskDistData = useMemo(
    () =>
      Object.entries(riskDistribution)
        .filter(([r]) => r !== 'unknown')
        .map(([risk, count]) => ({
          name: risk.charAt(0).toUpperCase() + risk.slice(1),
          value: count,
        })),
    [riskDistribution],
  );

  const strategyData = useMemo(
    () =>
      strategyDistribution
        .filter((s) => s.strategy && s.strategy !== 'unknown')
        .slice(0, 8)
        .map((s) => ({ name: s.strategy, value: s.count })),
    [strategyDistribution],
  );

  const industryBarData = useMemo(
    () =>
      industryDistribution
        .filter((d) => d.industry && d.industry !== 'other')
        .slice(0, 10)
        .map((d) => ({ name: d.industry, count: d.count })),
    [industryDistribution],
  );

  const weeklyData = useMemo(
    () => weeklyTrend.map((w) => ({ period: w.week, count: w.count, averageScore: w.avg_score })),
    [weeklyTrend],
  );

  const marketTableRows = useMemo(
    () => marketDataByIndustry.filter((m) => m.industry).slice(0, 15),
    [marketDataByIndustry],
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-12 pb-12">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="text-emerald-600" size={24} />
            Global Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time insights from all circular economy assessments worldwide
          </p>
        </div>
        <Button size="sm" variant="secondary" onPress={refetchGlobal} isDisabled={globalLoading}>
          <RefreshCw size={14} className={globalLoading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — GLOBAL ACTIVITY  (scoring_results_log — all calls)
          ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          icon={Globe}
          title="Global Activity"
          subtitle={`${totalScoringCalls.toLocaleString()} assessments scored — authenticated and anonymous`}
          iconCls="text-emerald-600"
        />

        {/* Primary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            label="Total Scored"
            value={totalScoringCalls.toLocaleString()}
            icon={Activity}
            color="emerald"
            loading={globalLoading}
          />
          <StatCard
            label="Avg Score"
            value={avgScore?.toFixed(1)}
            icon={Gauge}
            color="blue"
            loading={globalLoading}
          />
          <StatCard
            label="Avg Confidence"
            value={avgConfidence?.toFixed(0)}
            icon={Zap}
            color="amber"
            loading={globalLoading}
          />
          <StatCard
            label="Avg Tech Feasibility"
            value={avgTechFeas?.toFixed(0)}
            icon={Shield}
            color="purple"
            loading={globalLoading}
          />
          <StatCard
            label="Avg Econ Viability"
            value={avgEconViab?.toFixed(0)}
            icon={Building2}
            color="rose"
            loading={globalLoading}
          />
          <StatCard
            label="Saved Assessments"
            value={totalSavedAssessments.toLocaleString()}
            sub="opted-in contributors"
            icon={Users}
            color="indigo"
          />
        </div>

        {/* Secondary metrics — enrichment averages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Avg Circularity"
            value={avgCircPot?.toFixed(0)}
            icon={Sparkles}
            color="emerald"
            loading={globalLoading}
          />
          <StatCard
            label="Avg Consistency Score"
            value={avgParamConsistency?.toFixed(0)}
            sub="self-assessment reliability"
            icon={BarChart3}
            color="blue"
            loading={globalLoading}
          />
          <StatCard
            label="Avg Strategy Alignment"
            value={avgRAlignment?.toFixed(0)}
            sub="R-strategy fit"
            icon={Target}
            color="purple"
            loading={globalLoading}
          />
          <StatCard
            label="Industries Covered"
            value={industryDistribution.length}
            icon={Layers}
            color="indigo"
            loading={globalLoading}
          />
        </div>

        {/* Distribution charts row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <ChartCard
            title="Score Distribution"
            icon={BarChart3}
            iconCls="text-blue-600"
            loading={globalLoading}
          >
            {scoreDistData.length > 0 ? (
              <PieChart
                data={scoreDistData}
                height={192}
                colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
              />
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          <ChartCard
            title="Circular Economy Tier"
            icon={Target}
            iconCls="text-emerald-600"
            loading={globalLoading}
          >
            {tierDistData.length > 0 ? (
              <PieChart data={tierDistData} height={192} />
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          <ChartCard
            title="Risk Distribution"
            icon={Shield}
            iconCls="text-rose-600"
            loading={globalLoading}
          >
            {riskDistData.length > 0 ? (
              <PieChart data={riskDistData} height={192} />
            ) : (
              <EmptyChart />
            )}
          </ChartCard>
        </div>

        {/* Weekly trend + R-strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ChartCard
            title="Weekly Trend (Last 12 weeks)"
            icon={TrendingUp}
            iconCls="text-blue-600"
            loading={globalLoading}
            height="h-64"
          >
            {weeklyData.length > 0 ? (
              <LineChart
                data={weeklyData}
                lines={[{ dataKey: 'count', stroke: '#2563eb', name: 'Assessments' }]}
                height={224}
                xAxisKey="period"
              />
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          <ChartCard
            title="R-Strategy Distribution"
            icon={Layers}
            iconCls="text-purple-600"
            loading={globalLoading}
            height="h-64"
          >
            {strategyData.length > 0 ? (
              <BarChart
                data={strategyData}
                barConfigs={[{ dataKey: 'value', fill: '#a855f7' }]}
                xAxisKey="name"
                height={224}
                layout="horizontal"
              />
            ) : (
              <EmptyChart />
            )}
          </ChartCard>
        </div>

        {/* Industry volume bar chart */}
        {(globalLoading || industryBarData.length > 0) && (
          <ChartCard
            title="Top Industries by Assessment Volume"
            icon={Building2}
            iconCls="text-amber-600"
            loading={globalLoading}
            height="h-80"
          >
            {industryBarData.length > 0 ? (
              <BarChart
                data={industryBarData}
                barConfigs={[{ dataKey: 'count', fill: '#f59e0b' }]}
                xAxisKey="name"
                height={288}
              />
            ) : (
              <EmptyChart message="No industry data available" />
            )}
          </ChartCard>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — BENCHMARK INTELLIGENCE  (get_market_data RPC)
          ══════════════════════════════════════════════════════════════════════ */}
      {(globalLoading || marketTableRows.length > 0) && (
        <section>
          <SectionHeader
            icon={TrendingUp}
            title="Benchmark Intelligence"
            subtitle="Per-industry / per-scale / per-strategy benchmarks from public saved assessments"
            iconCls="text-blue-600"
          />

          <Card className="border border-slate-200 shadow-sm bg-white">
            <div className="p-4 overflow-x-auto">
              {globalLoading ? (
                <Skeleton className="w-full h-32 rounded" />
              ) : marketTableRows.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Industry</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Scale</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Strategy</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-700">
                        Avg Score
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-700">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketTableRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-3 text-slate-900">{row.industry}</td>
                        <td className="py-3 px-3 text-slate-700">{row.scale || '—'}</td>
                        <td className="py-3 px-3 text-slate-700">{row.strategy || '—'}</td>
                        <td className="py-3 px-3 text-right font-semibold text-blue-700">
                          {row.avg_score?.toFixed(1) || '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">{row.count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No benchmark data available yet
                </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — KNOWLEDGE BASE  (documents dataset + featured solutions)
          ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          icon={BookOpen}
          title="Knowledge Base"
          subtitle="Curated articles, case studies, and solutions from the database"
          iconCls="text-indigo-600"
        />

        {/* Doc stats top-line */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Documents"
            value={(
              docStats?.byIndustry?.reduce((sum, item) => sum + (item.count || 0), 0) || 0
            ).toLocaleString()}
            icon={BookOpen}
            color="indigo"
            loading={docLoading}
          />
          <StatCard
            label="Categories"
            value={docStats?.byCategory?.length ?? 0}
            icon={Layers}
            color="blue"
            loading={docLoading}
          />
          <StatCard
            label="Industries"
            value={docStats?.byIndustry?.length ?? 0}
            icon={Building2}
            color="amber"
            loading={docLoading}
          />
          <StatCard
            label="Sources"
            value={docStats?.bySource?.length ?? 0}
            icon={Globe}
            color="emerald"
            loading={docLoading}
          />
        </div>

        {/* Featured solutions search card */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <div className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Search Solutions</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Search for solutions, case studies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Search
                    size={16}
                    className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
                <Button
                  size="sm"
                  onPress={() => setActiveSearch(searchQuery || undefined)}
                  isDisabled={featuredLoading}
                >
                  Search
                </Button>
              </div>
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(4)
                  .fill(null)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded" />
                  ))}
              </div>
            ) : featuredSolutions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredSolutions.map((solution) => (
                  <div
                    key={solution.id}
                    className="border border-slate-200 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openDashboardFeaturedSolutionsDrawer(solution)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && openDashboardFeaturedSolutionsDrawer(solution)
                    }
                  >
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-slate-900 mb-1 line-clamp-2">
                        {solution.title}
                      </h4>
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                        {solution.description || 'No description'}
                      </p>
                      {solution.industry && (
                        <Chip size="sm" variant="secondary" className="text-xs">
                          {solution.industry}
                        </Chip>
                      )}
                      <div className="mt-2 flex items-center gap-1 text-slate-400">
                        <ChevronRight size={12} />
                        <span className="text-xs">View</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                {searchQuery
                  ? 'No solutions found. Try a different search.'
                  : 'No featured solutions yet.'}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — YOUR ASSESSMENTS  (authenticated users only)
          ══════════════════════════════════════════════════════════════════════ */}
      {user ? (
        <section>
          <SectionHeader
            icon={Activity}
            title="Your Assessments"
            subtitle={`You have ${userTotal} saved assessments`}
            iconCls="text-purple-600"
          />

          {/* User stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Assessments"
              value={userTotal}
              icon={Activity}
              color="purple"
              loading={userStatsLoading}
            />
            <StatCard
              label="Average Score"
              value={userAvg?.toFixed(1)}
              icon={Gauge}
              color="blue"
              loading={userStatsLoading}
            />
            <StatCard
              label="Median Score"
              value={userMedian?.toFixed(1)}
              sub={`Range: ${userMin}–${userMax}`}
              icon={BarChart3}
              color="emerald"
              loading={userStatsLoading}
            />
            <StatCard
              label="Avg Confidence"
              value={userConf?.toFixed(0)}
              icon={Zap}
              color="amber"
              loading={userStatsLoading}
            />
          </div>

          {/* User's secondary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Avg Tech Feasibility"
              value={userTechFeas?.toFixed(0)}
              icon={Shield}
              color="purple"
              loading={userStatsLoading}
            />
            <StatCard
              label="Avg Econ Viability"
              value={userEconViab?.toFixed(0)}
              icon={Building2}
              color="rose"
              loading={userStatsLoading}
            />
            <StatCard
              label="Avg Circularity"
              value={userCircPot?.toFixed(0)}
              icon={Sparkles}
              color="emerald"
              loading={userStatsLoading}
            />
          </div>

          {/* User's industry and risk distributions */}
          {!userStatsLoading && (userIndustryData.length > 0 || userRiskData.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {userIndustryData.length > 0 && (
                <ChartCard
                  title="Your Assessments by Industry"
                  icon={Building2}
                  iconCls="text-amber-600"
                >
                  <BarChart
                    data={userIndustryData}
                    barConfigs={[{ dataKey: 'count', fill: '#f59e0b' }]}
                    xAxisKey="name"
                    height={224}
                  />
                </ChartCard>
              )}

              {userRiskData.length > 0 && (
                <ChartCard
                  title="Your Projects by Risk Level"
                  icon={Shield}
                  iconCls="text-rose-600"
                >
                  <PieChart data={userRiskData} height={224} />
                </ChartCard>
              )}
            </div>
          )}
        </section>
      ) : (
        <Card className="border border-slate-200 shadow-sm bg-linear-to-br from-purple-50 to-white">
          <div className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-slate-900">Track Your Assessments</h3>
              <p className="text-sm text-slate-600 mt-1">
                Sign in to save your evaluations and track your circular economy progress
              </p>
            </div>
            <Button onPress={() => navigate('/auth')}>Sign In</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
