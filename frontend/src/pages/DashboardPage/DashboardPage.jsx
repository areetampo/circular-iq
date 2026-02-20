import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Card, Label, Chip, Tabs, Select, ListBox, Skeleton } from '@heroui/react';
import { Button } from '@/components/common';
import { ChartContainer } from '@/components/common/ChartWrapper';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Building2,
  Gauge,
  Layers,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { toTitleCase } from '@/lib/formatting';
import LoaderIcon from '@/components/common/LoaderIcon';
import { useEnhancedAnalytics } from '@/features/assessments';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { sortByAverageScoreDesc, sortByAverageScoreAsc } from '@/features/assessments/utils';
import { cn } from '@/utils/cn';
import { exportDashboardToPDF } from '@/lib/exportDashboard';
import { useToast } from '@/hooks/useToast';
import { PieChart, LineChart, ComboChart, BarChart } from '@/components/charts';
import { getCurrentTimestampFormatted } from '@/lib/formatting';
import IndustryChipFilter from '@/components/filters/IndustryChipFilter';
import FeaturedSolutionsCard from './FeaturedSolutionsCard';
import { INDUSTRY_THEMES } from '@/constants/industryThemes';

// Memoized metric card component for better performance
const MetricCard = memo(({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
    amber: 'bg-amber-500/10 text-amber-600',
    rose: 'bg-rose-500/10 text-rose-600',
  };

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-shadow">
      <Card.Header className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Card.Description className="text-md">{title}</Card.Description>
          <Card.Title className="text-3xl font-bold mt-0 mb-1">{value}</Card.Title>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm font-medium',
                trend > 0 ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>
                {Math.abs(trend).toFixed(1)}
                {trend > 0 ? ' increase' : ' decrease'}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full',
            colorClasses[color],
          )}
        >
          <Icon size={24} />
        </div>
      </Card.Header>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Memoized chart section
const ChartSection = memo(({ title, description, icon: Icon, children, actions }) => (
  <Card className="border-0 shadow-md overflow-hidden">
    <Card.Header className="flex flex-row items-start justify-between gap-4 mt-1.5">
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
        <Card.Title className="flex items-center gap-2 text-lg">
          {Icon && <Icon className="text-primary" size={20} />}
          {title}
        </Card.Title>
        {description && (
          <Card.Description className="text-sm text-slate-500">{description}</Card.Description>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </Card.Header>
    <Card.Content className=" overflow-hidden">{children}</Card.Content>
  </Card>
));

ChartSection.displayName = 'ChartSection';

export default function DashboardPage() {
  // Multi-select industries (like MyAssessmentsPage)
  const [selectedIndustries, setSelectedIndustries] = useState(['all']);
  const [timeRange, setTimeRange] = useState('180d');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, trends

  // Sorting for industry performance (client-side) — persisted to URL
  const [industrySort, setIndustrySort] = useState('avg_desc');

  // URL state (persist filters & view) — readable/shareable links
  const [searchParams, setSearchParams] = useSearchParams();

  // initialise from URL (first render)
  useEffect(() => {
    const industries = searchParams.get('industry');
    if (industries) {
      const items = industries
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length) setSelectedIndustries(items);
    }
    const tr = searchParams.get('timeRange');
    if (tr) setTimeRange(tr);
    const vm = searchParams.get('view');
    if (vm) setViewMode(vm);
    const is = searchParams.get('industrySort');
    if (is) setIndustrySort(is);
  }, []);

  // sync URL when filters change (keeps history clean using replace)
  useEffect(() => {
    const params = Object.fromEntries([...searchParams.entries()]);

    if (
      !selectedIndustries ||
      (selectedIndustries.length === 1 && selectedIndustries[0] === 'all')
    ) {
      delete params.industry;
    } else {
      params.industry = selectedIndustries.join(',');
    }

    if (timeRange && timeRange !== '180d') params.timeRange = timeRange;
    else delete params.timeRange;

    if (viewMode && viewMode !== 'overview') params.view = viewMode;
    else delete params.view;

    if (industrySort && industrySort !== 'avg_desc') params.industrySort = industrySort;
    else delete params.industrySort;

    setSearchParams(params, { replace: true });
  }, [selectedIndustries, timeRange, viewMode, industrySort]);

  const { addToast } = useToast();

  // All available industries (prefer canonical list from INDUSTRY_THEMES + any metrics)
  const { industryMetrics: allIndustryMetrics } = useEnhancedAnalytics({
    filters: { industry: 'all', timeRange: 'all' },
  });
  const industryOptions = useMemo(() => {
    const fromThemes = Object.keys(INDUSTRY_THEMES || {});
    const fromMetrics = (allIndustryMetrics || []).map((m) => m.industry);
    // keep 'all' first, then alphabetical
    const combined = Array.from(new Set(['all', ...fromThemes, ...fromMetrics]));
    return [
      'all',
      ...combined
        .filter((i) => i && i !== 'all')
        .sort((a, b) => String(a).localeCompare(String(b))),
    ];
  }, [allIndustryMetrics]);

  // Handle industry chip toggle
  const handleToggleIndustry = useCallback((industry) => {
    setSelectedIndustries((prev) => {
      if (industry === 'all') return ['all'];
      const next = new Set(prev);
      next.delete('all');
      if (next.has(industry)) next.delete(industry);
      else next.add(industry);
      if (next.size === 0) return ['all'];
      return Array.from(next);
    });
  }, []);

  // Compose filter param for analytics hook
  const industryFilterParam = useMemo(() => {
    const active = selectedIndustries.filter((i) => i !== 'all');
    if (active.length === 0) return undefined;
    return active.join(',');
  }, [selectedIndustries]);

  const filters = useMemo(
    () => ({
      industry: industryFilterParam,
      timeRange,
    }),
    [industryFilterParam, timeRange],
  );

  const {
    aggregate,
    industryMetrics,
    timeSeries,
    scoreDistribution,
    strategyDistribution,
    scaleDistribution,
    trends,
    overallVolatility,
    isLoading,
    isFetching,
    isError,
    error,
  } = useEnhancedAnalytics({ filters });

  // Featured solutions - support optional semantic query
  const [featuredQuery, setFeaturedQuery] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState(undefined);

  const { solutions: featuredSolutions = [], isLoading: solutionsLoading } = useFeaturedSolutions({
    limit: 3,
    industry: industryFilterParam,
    q: featuredSearch,
    enabled: !isLoading,
  });

  // Landing drawer integration (use landing drawer hook to open the shared drawer)
  const { openDashboardFeaturedSolutionsDrawer } = useGlobalDrawer();

  // Extra fetch to compute quick document stats (top keywords and count)
  const { solutions: statsSolutions = [], count: extendedCount = 0 } = useFeaturedSolutions({
    limit: 10,
    industry: industryFilterParam,
    enabled: !isLoading,
  });

  const topKeywords = useMemo(() => {
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'from',
      'to',
      'of',
      'in',
      'a',
      'an',
      'is',
      'are',
      'by',
      'on',
      'per',
    ]);
    const freq = {};
    statsSolutions.forEach((s) => {
      const text = `${s.title || ''} ${s.solution || ''} ${s.problem || ''}`;
      text.split(/\W+/).forEach((word) => {
        const w = word.toLowerCase();
        if (!w || w.length < 3 || stopWords.has(w) || /^\d+$/.test(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }, [statsSolutions]);

  // Pie chart color palette (colorblind-friendly, high contrast)
  const pieColors = [
    '#2563eb', // blue-600
    '#059669', // emerald-600
    '#f97316', // orange-500
    '#8b5cf6', // purple-500
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#6366f1', // indigo-500
    '#ec4899', // pink-500
    '#0f172a', // slate-900
    '#991b1b', // red-700
    '#0ea5a4', // teal-500
    '#2563eb', // repeat/support
  ];

  // Time range options for export / labels
  const timeRangeOptions = useMemo(
    () => [
      { label: '30 Days', value: '30d' },
      { label: '3 Months', value: '90d' },
      { label: '6 Months', value: '180d' },
      { label: 'All Time', value: 'all' },
    ],
    [],
  );

  // Derived display values
  const formattedAverage = useMemo(
    () =>
      aggregate && typeof aggregate.averageScore === 'number'
        ? aggregate.averageScore.toFixed(1)
        : '0.0',
    [aggregate],
  );

  // Demo fallback data when API returns empty results
  const demoTimeSeriesData = [
    { period: '2025-W48', averageScore: 65, avgViability: 58, growth: 3 },
    { period: '2025-W49', averageScore: 68, avgViability: 61, growth: 5 },
    { period: '2025-W50', averageScore: 70, avgViability: 63, growth: 7 },
    { period: '2025-W51', averageScore: 72, avgViability: 65, growth: 4 },
    { period: '2025-W52', averageScore: 75, avgViability: 68, growth: 6 },
    { period: '2026-W01', averageScore: 78, avgViability: 70, growth: 8 },
    { period: '2026-W02', averageScore: 77, avgViability: 72, growth: 5 },
  ];

  const demoScoreDistribution = [
    { name: '0-20', value: 2, percent: 5 },
    { name: '20-40', value: 5, percent: 12 },
    { name: '40-60', value: 12, percent: 28 },
    { name: '60-80', value: 18, percent: 42 },
    { name: '80-100', value: 6, percent: 14 },
  ];

  const demoScaleDistribution = [
    { name: 'Startup', value: 8, percent: 18 },
    { name: 'SME', value: 18, percent: 42 },
    { name: 'Enterprise', value: 12, percent: 28 },
    { name: 'Non-Profit', value: 5, percent: 12 },
  ];

  const demoIndustryMetrics = [
    { industry: 'energy', averageScore: 82, count: 12, avgViability: 79 },
    { industry: 'packaging', averageScore: 76, count: 14, avgViability: 71 },
    { industry: 'textiles', averageScore: 73, count: 10, avgViability: 68 },
    { industry: 'construction', averageScore: 70, count: 9, avgViability: 65 },
    { industry: 'electronics', averageScore: 68, count: 7, avgViability: 62 },
  ];

  const timeSeriesData = timeSeries && timeSeries.length > 0 ? timeSeries : demoTimeSeriesData;
  const trendConfig = {};

  const strategyChartData = useMemo(() => {
    const data =
      strategyDistribution && strategyDistribution.length > 0
        ? strategyDistribution
        : [
            { strategy: 'Reuse & Refurbishment', value: 14, average_score: 76 },
            { strategy: 'Material Recovery', value: 18, average_score: 72 },
            { strategy: 'Component Remanufacturing', value: 12, average_score: 79 },
            { strategy: 'Design for Disassembly', value: 10, average_score: 74 },
          ];
    return data.map((s, idx) => ({
      name: s.strategy || s.name || 'Unknown',
      value: s.value || s.count || 0,
      averageScore: s.averageScore || s.average_score || 0,
      percentage: s.percentage || s.percent || 0,
      color: pieColors[idx % pieColors.length],
    }));
  }, [strategyDistribution]);

  const scaleChartData = useMemo(() => {
    const source =
      scaleDistribution && scaleDistribution.length > 0
        ? scaleDistribution
        : demoScaleDistribution.map((d) => ({
            scale: d.name,
            count: d.value,
            percentage: d.percent,
          }));
    return source.map((s, idx) => ({
      name: s.scale || s.name || 'Unknown',
      value: s.count || s.value || 0,
      percent: s.percentage || s.percent || 0,
      color: pieColors[idx % pieColors.length],
    }));
  }, [scaleDistribution]);

  const mostActiveIndustry = useMemo(() => {
    if (!industryMetrics || industryMetrics.length === 0) return null;
    return industryMetrics.slice().sort((a, b) => b.count - a.count)[0];
  }, [industryMetrics]);

  // Industry label map for chips
  const industryLabelMap = useMemo(() => {
    const map = {};
    allIndustryMetrics.forEach((m) => {
      map[m.industry] = toTitleCase(m.industry);
    });
    map['all'] = 'All Industries';
    return map;
  }, [allIndustryMetrics]);

  // Aggregate industry metrics for selected industries
  const filteredIndustryMetrics = useMemo(() => {
    if (selectedIndustries.includes('all')) return industryMetrics;
    return industryMetrics.filter((m) => selectedIndustries.includes(m.industry));
  }, [industryMetrics, selectedIndustries]);

  // Pie chart data for selected industries (use demo when API returns empty so charts are never blank)
  const filteredPieChartData = useMemo(() => {
    const source =
      scoreDistribution && scoreDistribution.length > 0
        ? scoreDistribution
        : demoScoreDistribution.map((d) => ({
            range: d.name,
            count: d.value,
            percentage: d.percent,
          }));
    return source.map((bucket, idx) => ({
      name: bucket.range || bucket.name || 'Unknown',
      value: bucket.count || bucket.value || 0,
      percent: bucket.percentage || bucket.percent || 0,
      color: pieColors[idx % pieColors.length],
      label: `${bucket.range || bucket.name} (${bucket.count || bucket.value}, ${bucket.percentage || bucket.percent}%)`,
    }));
  }, [scoreDistribution]);

  // Industry Performance Bar Chart Data (use demo when no API data so chart is never empty)
  const industryPerformanceData = useMemo(() => {
    let source =
      filteredIndustryMetrics && filteredIndustryMetrics.length > 0
        ? filteredIndustryMetrics
        : industryMetrics;
    if (!source || source.length === 0) source = demoIndustryMetrics;

    const mapped = source.map((m, idx) => ({
      ...m,
      industry: m.industry,
      label: toTitleCase(m.industry),
      color: pieColors[idx % pieColors.length],
      averageScore: typeof m.averageScore === 'number' ? m.averageScore : m.average_score || 0,
    }));

    switch (industrySort) {
      case 'avg_asc':
        return mapped.slice().sort(sortByAverageScoreAsc);
      case 'count_desc':
        return mapped.slice().sort((a, b) => (b.count || 0) - (a.count || 0));
      case 'count_asc':
        return mapped.slice().sort((a, b) => (a.count || 0) - (b.count || 0));
      case 'avg_desc':
      default:
        return mapped.slice().sort(sortByAverageScoreDesc);
    }
  }, [filteredIndustryMetrics, industryMetrics, industrySort]);

  // Helper for empty chart states
  const EmptyChartState = ({ message }) => (
    <div className="flex items-center justify-center h-full text-gray-400 text-base font-medium py-12">
      {message}
    </div>
  );

  // IndustryChipFilter for dashboard (render only the chips here; label is provided by the parent)
  const renderIndustryChipFilter = () => (
    <div className="w-full overflow-x-auto py-1">
      <div className="flex gap-2 flex-nowrap">
        <IndustryChipFilter
          industries={industryOptions}
          selected={selectedIndustries}
          onToggle={handleToggleIndustry}
          labelMap={industryLabelMap}
        />
      </div>
    </div>
  );

  const renderStatus = useCallback(() => {
    if (isLoading) return 'Loading analytics...';
    if (isError) return error || 'Unable to load analytics.';
    if (!aggregate.totalCount) return 'No assessments yet. Submit an audit to populate insights.';
    return 'Comprehensive analytics across all circular economy assessments.';
  }, [isLoading, isError, error, aggregate.totalCount]);

  const handleClearFilters = useCallback(() => {
    setSelectedIndustries(['all']);
    setTimeRange('180d');
  }, []);

  const handleExportPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      await exportDashboardToPDF({
        elementId: 'dashboard-content',
        filters: { industry: industryFilterParam, timeRange },
        timeRangeOptions,
      });
      addToast('Dashboard exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addToast('Failed to export dashboard. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [industryFilterParam, timeRange, timeRangeOptions, addToast]);

  const timeRangeLabel = useMemo(
    () => timeRangeOptions.find((option) => option.value === timeRange)?.label || 'Last 6 Months',
    [timeRange, timeRangeOptions],
  );

  const isBusy = isLoading || isFetching;

  return (
    <div
      id="dashboard-content"
      className={cn('space-y-8 transition-opacity duration-300 p-4', isBusy && 'opacity-60')}
    >
      {/* HEADER: Title + Status */}
      <p className="text-sm text-slate-600 max-w-2xl text-center mx-auto mb-4">
        Last updated: {getCurrentTimestampFormatted()}
      </p>

      {/* KEY METRICS */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                className="rounded-lg h-32 bg-gradient-to-br from-slate-100 to-slate-50"
                animationType="pulse"
              />
            ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Assessments"
            value={aggregate.totalCount || 0}
            subtitle={`${aggregate.publicCount ?? 0} public, ${aggregate.contributingCount ?? 0} contributing to benchmarks`}
            icon={Layers}
            trend={trends.recentGrowth}
            color="primary"
          />

          <MetricCard
            title="Average Score"
            value={formattedAverage}
            subtitle={`Median: ${aggregate.medianScore || 0}`}
            icon={Gauge}
            trend={trends.scoreImprovement}
            color="emerald"
          />

          <MetricCard
            title="Avg Viability"
            value={Number(aggregate.avgViability || 0).toFixed(1)}
            subtitle="Business readiness"
            icon={Target}
            color="indigo"
          />

          <MetricCard
            title="Active Industries"
            value={industryMetrics.length}
            subtitle={
              industryMetrics.length > 0
                ? `Top: ${toTitleCase(industryMetrics[0].industry)}`
                : 'N/A'
            }
            icon={Building2}
            color="amber"
          />
        </div>
      )}

      {/* FILTERS: Industry Chips + Time Range + Actions */}
      <Card className="border-0 shadow-sm bg-white">
        {/* <Card.Header>
          <Card.Title className="text-lg">Filters</Card.Title>
        </Card.Header> */}
        <Card.Content className="space-y-4 p-2 md:p-4">
          {/* Industry Filter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700">Filter by Industry</Label>
              <span className="text-xs text-slate-400">
                Showing {industryOptions.length - 1} sectors
                {typeof overallVolatility === 'number' && (
                  <> · Volatility: {overallVolatility.toFixed(1)}</>
                )}
              </span>
            </div>
            {renderIndustryChipFilter()}
          </div>

          <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-end md:justify-between">
            {/* Time Range + Buttons Row */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-700">Time Range</Label>

              {/* Select */}
              <div>
                <Select
                  value={timeRange}
                  onChange={setTimeRange}
                  variant="secondary"
                  size="normal md:sm"
                  className="w-2/3 md:w-44"
                >
                  <Select.Trigger className="mt-2 md:mt-0">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="30d">30 Days</ListBox.Item>
                      <ListBox.Item id="90d">3 Months</ListBox.Item>
                      <ListBox.Item id="180d">6 Months</ListBox.Item>
                      <ListBox.Item id="all">All Time</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                id="dashboard-export-button"
                variant="teal"
                onClick={handleExportPDF}
                disabled={isExporting || isBusy}
                size="md"
                aria-label="Export dashboard as PDF"
              >
                {isExporting ? (
                  <>
                    <LoaderIcon />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" size={16} />
                    Export PDF
                  </>
                )}
              </Button>
              <Button variant="neutral" onClick={handleClearFilters} size="md">
                Clear Filters
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* VIEW MODE TABS */}
      <Tabs
        selectedKey={viewMode}
        onSelectionChange={setViewMode}
        variant="primary"
        className="w-full"
      >
        {/* Mobile: switch to Select for compact screens */}
        <div className="md:hidden my-0 w-full flex items-center justify-center">
          <Select value={viewMode} onChange={setViewMode} variant="primary" className="w-3/5">
            <Label className="text-xs font-semibold text-slate-600">View</Label>
            <Select.Trigger className="mt-2">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="overview">Overview</ListBox.Item>
                <ListBox.Item id="detailed">Detailed</ListBox.Item>
                <ListBox.Item id="trends">Trends</ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <Tabs.ListContainer className="my-4 hidden md:flex justify-center">
          <Tabs.List
            aria-label="Dashboard View"
            className="bg-blue-50/60 border-2 border-sky-200/40"
          >
            <Tabs.Tab id="overview">
              Overview
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="detailed">
              Detailed
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="trends">
              Trends
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* OVERVIEW VIEW */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Trends and Distribution Row */}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <ChartSection
              title="Performance Trends"
              description="Score and viability trends over time"
              icon={Activity}
            >
              {timeSeriesData.length > 0 ? (
                <div
                  className={cn('w-full min-w-0', isLoading && 'opacity-50')}
                  style={{ height: '320px' }}
                >
                  <LineChart
                    data={timeSeriesData}
                    xAxisKey="period"
                    lines={[
                      { dataKey: 'averageScore', stroke: '#2563eb', name: 'Avg Score', area: true },
                      {
                        dataKey: 'avgViability',
                        stroke: '#059669',
                        name: 'Avg Viability',
                        area: true,
                      },
                    ]}
                    height={320}
                  />
                </div>
              ) : (
                <EmptyChartState message="No trend data available" />
              )}
            </ChartSection>

            <div className="space-y-4">
              <ChartSection
                title="Score Distribution"
                description="Assessment score ranges"
                icon={PieChartIcon}
              >
                {filteredPieChartData.length > 0 ? (
                  <div className={cn('w-full', isLoading && 'opacity-50')}>
                    <div style={{ height: '300px', minHeight: '300px' }}>
                      <PieChart
                        data={filteredPieChartData}
                        dataKey="value"
                        nameKey="name"
                        height={300}
                        colors={filteredPieChartData.map((d) => d.color)}
                        showLegend={true}
                        showDataSummary={true}
                        innerRadius={70}
                        centerLabel={{
                          main: aggregate?.totalCount || 0,
                          subLabel: `Avg ${formattedAverage}`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <EmptyChartState message="No distribution data" />
                )}
              </ChartSection>

              <ChartSection
                title="Scale Distribution"
                description="Company size breakdown"
                icon={Users}
              >
                {scaleChartData.length > 0 ? (
                  <div className={cn('w-full', isLoading && 'opacity-50')}>
                    <div style={{ height: '280px', minHeight: '280px' }}>
                      <PieChart
                        data={scaleChartData}
                        dataKey="value"
                        nameKey="name"
                        height={280}
                        colors={scaleChartData.map((d) => d.color)}
                        showLegend={false}
                        showDataSummary={true}
                        innerRadius={50}
                      />
                    </div>
                  </div>
                ) : (
                  <EmptyChartState message="No scale data" />
                )}
              </ChartSection>
            </div>
          </div>

          {/* Industry Performance  */}
          <ChartSection
            title="Industry Performance"
            description="Average scores and assessment count by sector"
            icon={BarChart3}
            actions={
              <Select
                value={industrySort}
                onChange={setIndustrySort}
                variant="secondary"
                size="sm"
                className="w-40"
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="avg_desc">Avg Score (High → Low)</ListBox.Item>
                    <ListBox.Item id="avg_asc">Avg Score (Low → High)</ListBox.Item>
                    <ListBox.Item id="count_desc">Count (High → Low)</ListBox.Item>
                    <ListBox.Item id="count_asc">Count (Low → High)</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            }
          >
            <div className="w-full min-w-0">
              {industryPerformanceData.length > 0 ? (
                <div className="w-full" style={{ height: '400px' }}>
                  <BarChart
                    data={industryPerformanceData.map((m) => ({
                      name: m.label || toTitleCase(m.industry),
                      value: m.averageScore,
                      averageScore: m.averageScore,
                    }))}
                    barConfigs={[{ dataKey: 'averageScore', name: 'Avg Score' }]}
                    barColors={industryPerformanceData.map((m) => m.color || pieColors[0])}
                    height={400}
                    showLegend={false}
                    showGrid={true}
                    yAxisDomain={[0, 100]}
                    yAxisLabel="Score"
                  />
                </div>
              ) : (
                <EmptyChartState message="No industry data available" />
              )}
            </div>
          </ChartSection>

          {/* Featured Solutions */}
          <FeaturedSolutionsCard industry={industryFilterParam} />
        </div>
      )}

      {/* DETAILED VIEW */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* Detailed Industry Metrics Table */}
          <ChartSection
            title="Comprehensive Industry Analysis"
            description="Full metrics including viability, median, and score ranges"
            icon={BarChart3}
          >
            <div className="overflow-x-auto">
              {industryMetrics.length > 0 ? (
                <Table
                  aria-label="Industry Metrics"
                  classNames={{
                    th: 'bg-slate-50 border-b text-left font-semibold text-slate-900',
                  }}
                >
                  <TableHeader>
                    <TableColumn className="text-left">Industry</TableColumn>
                    <TableColumn className="text-center">Count</TableColumn>
                    <TableColumn className="text-center">Avg Score</TableColumn>
                    <TableColumn className="text-center">Viability</TableColumn>
                    <TableColumn className="text-center">Median</TableColumn>
                    <TableColumn className="text-center">Range</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {industryMetrics
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((metric) => (
                        <TableRow key={metric.industry} className="hover:bg-slate-50 border-b">
                          <TableCell className="font-medium text-slate-900">
                            {metric.industry
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </TableCell>
                          <TableCell className="text-center text-slate-700">
                            {metric.count}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {typeof metric.averageScore === 'number'
                                ? metric.averageScore.toFixed(1)
                                : metric.average_score?.toFixed(1) || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-slate-700">
                            {typeof metric.avgViability === 'number'
                              ? metric.avgViability.toFixed(1)
                              : metric.avg_viability?.toFixed(1) || '—'}
                          </TableCell>
                          <TableCell className="text-center text-slate-700">
                            {metric.median || '—'}
                          </TableCell>
                          <TableCell className="text-center text-xs text-slate-600">
                            {metric.min || '—'} - {metric.max || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-500">No industry data available</div>
              )}
            </div>
          </ChartSection>

          {/* Strategy and Scale Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSection
              title="R-Strategy Distribution"
              description="Circular economy strategies used"
              icon={Target}
            >
              <div className="space-y-3">
                {strategyChartData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 min-w-0">
                    <div className="w-full min-w-0" style={{ height: '320px' }}>
                      <div className="w-full min-w-0" style={{ height: '320px' }}>
                        <ComboChart
                          data={strategyChartData}
                          bars={[{ dataKey: 'value', fill: pieColors[0], name: 'Count' }]}
                          lines={[
                            { dataKey: 'averageScore', stroke: '#059669', name: 'Avg Score' },
                          ]}
                          xAxisKey="name"
                          leftYAxisKey="value"
                          rightYAxisKey="averageScore"
                          barColors={strategyChartData.map((s) => s.color)}
                          height={320}
                        />
                      </div>
                    </div>

                    <div className="w-full min-w-0 shrink-0" style={{ minHeight: '300px' }}>
                      <div className="min-w-0" style={{ height: '300px' }}>
                        <PieChart
                          data={strategyChartData.map((s) => ({ name: s.name, value: s.value }))}
                          dataKey="value"
                          nameKey="name"
                          height={300}
                          innerRadius={46}
                          showLegend={false}
                          showDataSummary={true}
                          colors={strategyChartData.map((s) => s.color)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyChartState message="No strategy data" />
                )}
              </div>
            </ChartSection>
            <ChartSection
              title="Scale Distribution"
              description="Company size distribution"
              icon={Users}
            >
              {scaleChartData.length > 0 ? (
                <div style={{ height: '300px', minHeight: '300px' }}>
                  <PieChart
                    data={scaleChartData}
                    dataKey="value"
                    nameKey="name"
                    height={300}
                    innerRadius={54}
                    centerLabel={{ main: aggregate?.totalCount || 0, subLabel: 'companies' }}
                    showLegend={true}
                    showDataSummary={true}
                  />
                </div>
              ) : (
                <EmptyChartState message="No scale data" />
              )}
            </ChartSection>
          </div>
        </div>
      )}

      {/* TRENDS VIEW */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          {/* Growth Trends */}
          <ChartSection
            title="Weekly Assessment Growth"
            description="New assessments submitted over time"
            icon={TrendingUp}
          >
            <div className="w-full min-w-0" style={{ height: '300px' }}>
              {timeSeries.length > 0 ? (
                <LineChart
                  data={timeSeries}
                  lines={[{ dataKey: 'growth', stroke: '#2563eb', name: 'New Assessments' }]}
                  xAxisKey="period"
                  height={300}
                />
              ) : (
                <EmptyChartState message="No trend data" />
              )}
            </div>
          </ChartSection>

          {/* Comparative Trends */}
          <ChartSection
            title="Score vs Viability Trends"
            description="Comparative analysis of scores and business viability"
            icon={Activity}
          >
            <div className="w-full min-w-0" style={{ height: '360px' }}>
              {timeSeries.length > 0 ? (
                <LineChart
                  data={timeSeries}
                  lines={[
                    { dataKey: 'averageScore', stroke: pieColors[0], name: 'Average Score' },
                    { dataKey: 'avgViability', stroke: pieColors[1], name: 'Avg Viability' },
                  ]}
                  xAxisKey="period"
                  height={360}
                />
              ) : (
                <EmptyChartState message="No trend data" />
              )}
            </div>
          </ChartSection>

          {/* Key Insights */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <Card.Header className="border-b border-slate-100 py-3">
              <Card.Title className="flex items-center gap-2 text-slate-800 text-base">
                <Sparkles className="text-slate-500" size={16} />
                Key Insights
              </Card.Title>
            </Card.Header>
            <Card.Content className="py-4">
              <div className="space-y-5">
                {/* Insight 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 font-medium text-xs">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Recent Growth</p>
                    <p className="text-sm text-slate-600">
                      {trends.recentGrowth > 0
                        ? `${trends.recentGrowth} new assessments in recent weeks.`
                        : 'No recent assessments.'}
                    </p>
                  </div>
                </div>

                {/* Insight 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 font-medium text-xs">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Score Improvement</p>
                    <p className="text-sm text-slate-600">
                      {trends.scoreImprovement !== 0
                        ? trends.scoreImprovement > 0
                          ? `Scores improved by ${trends.scoreImprovement.toFixed(1)} points`
                          : `Scores decreased by ${Math.abs(trends.scoreImprovement).toFixed(1)} points`
                        : 'Scores remain stable'}
                    </p>
                  </div>
                </div>

                {/* Insight 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 font-medium text-xs">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Industry Coverage</p>
                    <p className="text-sm text-slate-600">
                      {industryMetrics.length > 0
                        ? `${industryMetrics.length} active industries`
                        : 'No industry data yet'}
                    </p>
                  </div>
                </div>

                {/* Next Steps Section */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Suggested next steps
                    </p>
                    <span className="text-[10px] text-slate-400 italic">Auto-generated</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {(() => {
                      const low = (industryMetrics || [])
                        .slice()
                        .sort(sortByAverageScoreAsc)
                        .slice(0, 3);

                      if (!low || low.length === 0) {
                        return (
                          <div className="text-sm text-slate-500">No targeted actions needed</div>
                        );
                      }

                      const mapAction = (ind) => {
                        const label = ind.label || ind.industry;
                        const score = ind.averageScore?.toFixed(0) || ind.average_score || '—';
                        const suggestion =
                          ind.averageScore <= 50
                            ? 'Prioritise product redesign'
                            : ind.averageScore <= 70
                              ? 'Pilot reuse programs'
                              : 'Maintain best practices';
                        return { label, score, suggestion };
                      };

                      return low.map((l) => {
                        const info = mapAction(l);
                        return (
                          <Button
                            key={l.industry}
                            variant="teal-soft"
                            className=""
                            onPress={() => setSelectedIndustries([l.industry])}
                          >
                            <span className="text-sm font-medium text-slate-900 block capitalize">
                              {info.label.replace(/_/g, ' ')} (Avg {info.score})
                            </span>
                            <span className="text-xs text-slate-500 block">{info.suggestion}</span>
                          </Button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
