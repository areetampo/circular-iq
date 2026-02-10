import React, { useMemo, useState, useCallback, memo } from 'react';
import { Card, Label, Chip, Tabs, Select, ListBox } from '@heroui/react';
import { Button } from '@/components/common';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/common/ChartWrapper';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
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
import LoaderIcon from '@/components/common/LoaderIcon';
import { useEnhancedAnalytics } from '@/features/assessments';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { cn } from '@/utils/cn';
import { exportDashboardToPDF } from '@/lib/exportDashboard';
import { useToast } from '@/hooks/useToast';
import { PieChart, LineChart, ComboChart } from '@/components/charts';
import IndustryChipFilter from '@/components/filters/IndustryChipFilter';
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
          <Card.Description className="text-xs">{title}</Card.Description>
          <Card.Title className="text-3xl font-bold mt-0 mb-1">{value}</Card.Title>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm font-medium',
                trend > 0 ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
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
          <Icon className="w-6 h-6" />
        </div>
      </Card.Header>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Memoized chart section
const ChartSection = memo(({ title, description, icon: Icon, children, actions }) => (
  <Card className="border-0 shadow-md">
    <Card.Header className="flex flex-row items-start justify-between gap-4">
      <div className="flex-1">
        <Card.Title className="flex items-center gap-2 text-lg mb-1">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          {title}
        </Card.Title>
        {description && (
          <Card.Description className="text-sm text-slate-500">{description}</Card.Description>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </Card.Header>
    <Card.Content>{children}</Card.Content>
  </Card>
));

ChartSection.displayName = 'ChartSection';

export default function DashboardPage() {
  // Multi-select industries (like MyAssessmentsPage)
  const [selectedIndustries, setSelectedIndustries] = useState(['all']);
  const [timeRange, setTimeRange] = useState('180d');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, trends

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndustries, timeRange, viewMode]);

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
    isLoading,
    isFetching,
    isError,
    error,
  } = useEnhancedAnalytics({ filters });

  // Featured solutions (uses documents dataset on the server) — surfaced on overview
  const { solutions: featuredSolutions = [], isLoading: solutionsLoading } = useFeaturedSolutions({
    limit: 3,
    enabled: !isLoading,
  });

  // Pie chart color palette (colorblind-friendly, high contrast)
  const pieColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e42', // orange
    '#a78bfa', // purple
    '#ef4444', // red
    '#fbbf24', // yellow
    '#6366f1', // indigo
    '#f472b6', // pink
    '#22223b', // dark blue
    '#9d0208', // dark red
    '#43aa8b', // teal
    '#577590', // steel blue
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

  const timeSeriesData = timeSeries || [];
  const trendConfig = {};

  const strategyChartData = useMemo(() => {
    if (!strategyDistribution || strategyDistribution.length === 0) return [];
    return strategyDistribution.map((s, idx) => ({
      ...s,
      color: pieColors[idx % pieColors.length],
      name: s.strategy || s.name,
    }));
  }, [strategyDistribution]);

  const scaleChartData = useMemo(() => {
    if (!scaleDistribution || scaleDistribution.length === 0) return [];
    return scaleDistribution.map((s, idx) => ({
      ...s,
      color: pieColors[idx % pieColors.length],
      name: s.name,
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
      map[m.industry] = m.industry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    });
    map['all'] = 'All Industries';
    return map;
  }, [allIndustryMetrics]);

  // Aggregate industry metrics for selected industries
  const filteredIndustryMetrics = useMemo(() => {
    if (selectedIndustries.includes('all')) return industryMetrics;
    return industryMetrics.filter((m) => selectedIndustries.includes(m.industry));
  }, [industryMetrics, selectedIndustries]);

  // Pie chart data for selected industries
  const filteredPieChartData = useMemo(() => {
    if (!scoreDistribution || scoreDistribution.length === 0) return [];
    // Always show all score buckets, but highlight only selected industries if not 'all'
    return scoreDistribution.map((bucket, idx) => ({
      ...bucket,
      color: pieColors[idx % pieColors.length],
      label: `${bucket.name} (${bucket.value}, ${bucket.percent}%)`,
    }));
  }, [scoreDistribution]);

  // Industry Performance Bar Chart Data
  const industryPerformanceData = useMemo(() => {
    const source =
      filteredIndustryMetrics && filteredIndustryMetrics.length > 0
        ? filteredIndustryMetrics
        : industryMetrics;
    if (!source || source.length === 0) return [];
    return source
      .map((m, idx) => ({
        ...m,
        industry: m.industry,
        label: m.industry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        color: pieColors[idx % pieColors.length],
        averageScore: typeof m.averageScore === 'number' ? m.averageScore : m.average_score || 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore); // show highest scoring industries first
  }, [filteredIndustryMetrics, industryMetrics]);

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
      className={cn('space-y-6 transition-opacity duration-300 p-1', isBusy && 'opacity-60')}
    >
      {/* HEADER: Title + Status */}
      <div className="flex flex-col gap-3 md:gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Global Dashboard</h1>
        <p className="text-base text-slate-600 max-w-2xl">
          Track circular economy performance across all assessments.
        </p>
      </div>

      {/* FILTERS: Industry Chips + Time Range + Actions */}
      <Card className="border-0 shadow-sm bg-white">
        <Card.Header className="pb-2">
          <Card.Title className="text-base">Filters</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          {/* Industry Filter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700">Filter by Industry</Label>
              <span className="text-xs text-slate-400">
                Showing {industryOptions.length - 1} sectors
              </span>
            </div>
            {renderIndustryChipFilter()}
          </div>

          {/* Time Range + Buttons Row */}
          <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-700">Time Range</Label>

              {/* Mobile: compact Select */}
              <div className="md:hidden">
                <Select
                  value={timeRange}
                  onChange={setTimeRange}
                  variant="secondary"
                  className="w-2/3"
                >
                  <Label className="text-xs font-semibold text-slate-600">Time Range</Label>
                  <Select.Trigger className="mt-2">
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

              {/* Desktop: tabs */}
              <div className="hidden md:block">
                <Tabs
                  selectedKey={timeRange}
                  onSelectionChange={setTimeRange}
                  variant="secondary"
                  className="w-fit"
                >
                  <Tabs.ListContainer>
                    <Tabs.List aria-label="Time Range" className="gap-1">
                      <Tabs.Tab id="30d">
                        30 Days
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab id="90d">
                        3 Months
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab id="180d">
                        6 Months
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab id="all">
                        All Time
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>
                </Tabs>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                id="dashboard-export-button"
                variant="primary"
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
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
              <Button variant="neutral-soft" onClick={handleClearFilters} size="md">
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
        <div className="md:hidden my-2 w-full flex items-center justify-center">
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

      {/* KEY METRICS */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg h-32 animate-pulse"
              />
            ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Assessments"
            value={aggregate.totalCount || 0}
            subtitle={`${aggregate.publicCount || 0} public`}
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
                ? `Top: ${industryMetrics[0].industry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`
                : 'N/A'
            }
            icon={Building2}
            color="amber"
          />
        </div>
      )}

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
              <div className={cn('w-full h-[320px]', isLoading && 'opacity-50')}>
                {timeSeriesData.length > 0 ? (
                  <ChartContainer config={trendConfig} className="h-full w-full">
                    <AreaChart
                      data={timeSeriesData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="viabilityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="period" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Area
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#3b82f6"
                        fill="url(#scoreGradient)"
                        strokeWidth={2}
                        name="Avg Score"
                      />
                      <Area
                        type="monotone"
                        dataKey="avgViability"
                        stroke="#10b981"
                        fill="url(#viabilityGradient)"
                        strokeWidth={2}
                        name="Avg Viability"
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <EmptyChartState message="No trend data available" />
                )}
              </div>
            </ChartSection>

            <div className="space-y-4">
              <ChartSection
                title="Score Distribution"
                description="Assessment score ranges"
                icon={PieChartIcon}
              >
                <div className="h-[320px] w-full flex items-center justify-center">
                  {filteredPieChartData.length > 0 ? (
                    <PieChart
                      data={filteredPieChartData}
                      dataKey="value"
                      nameKey="name"
                      height={300}
                      width={360}
                      colors={filteredPieChartData.map((d) => d.color)}
                      labelType="percent"
                      showLegend={true}
                      innerRadius={70}
                      centerLabel={{
                        main: aggregate?.totalCount || 0,
                        subLabel: `Avg ${formattedAverage}`,
                      }}
                    />
                  ) : (
                    <EmptyChartState message="No distribution data" />
                  )}
                </div>
              </ChartSection>

              <Card className="border-0 shadow-sm">
                <Card.Header>
                  <Card.Title className="flex items-center gap-2 text-md">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Featured Solutions
                  </Card.Title>
                  <Card.Description className="text-sm text-slate-500">
                    Examples from the dataset to inspire solutions
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  {solutionsLoading ? (
                    <div className="py-8 flex items-center justify-center">Loading...</div>
                  ) : featuredSolutions.length > 0 ? (
                    <div className="grid gap-3">
                      {featuredSolutions.map((s) => (
                        <div key={s.id} className="flex gap-3 items-start">
                          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold">
                            {s.title?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-sm font-semibold truncate">{s.title}</h4>
                              <span className="text-xs text-slate-400">
                                {s.wordCount || 0} words
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 truncate">
                              {s.solution || s.problem || ''}
                            </p>
                            <div className="mt-2 text-xs text-slate-400">{s.category}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      No featured solutions available
                    </div>
                  )}
                </Card.Content>
              </Card>
            </div>
          </div>

          {/* Industry Performance  */}
          <ChartSection
            title="Industry Performance"
            description="Average scores and assessment count by sector"
            icon={BarChart3}
          >
            <div className="h-[360px] w-full">
              {industryPerformanceData.length > 0 ? (
                <ChartContainer className="h-full w-full">
                  <BarChart
                    data={industryPerformanceData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                    barCategoryGap="24%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="industry"
                      tickLine={false}
                      axisLine={false}
                      angle={-30}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={({ x, y, payload }) => {
                        const industryKey = payload.value;
                        const label = industryKey
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <text
                            x={x}
                            y={y + 10}
                            textAnchor="end"
                            fill="#374151"
                            fontWeight="600"
                            fontSize={11}
                          >
                            {label}
                          </text>
                        );
                      }}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar
                      dataKey="averageScore"
                      radius={[6, 6, 0, 0]}
                      name="Avg Score"
                      label={{ position: 'top', fill: '#1f2937', fontWeight: 600, fontSize: 11 }}
                    >
                      {industryPerformanceData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.color || pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChartState message="No industry data available" />
              )}
            </div>
          </ChartSection>
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
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Industry</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">Count</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">
                        Avg Score
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">
                        Viability
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">Median</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {industryMetrics
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((metric) => (
                        <tr key={metric.industry} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {metric.industry
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700">{metric.count}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {typeof metric.averageScore === 'number'
                                ? metric.averageScore.toFixed(1)
                                : metric.average_score?.toFixed(1) || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700">
                            {typeof metric.avgViability === 'number'
                              ? metric.avgViability.toFixed(1)
                              : metric.avg_viability?.toFixed(1) || '—'}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700">
                            {metric.median || '—'}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-slate-600">
                            {metric.min || '—'} - {metric.max || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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
              <div className="h-[300px]">
                {strategyChartData.length > 0 ? (
                  <ChartContainer className="h-full w-full">
                    <ComboChart
                      data={strategyChartData}
                      bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Count' }]}
                      lines={[
                        {
                          dataKey: 'averageScore',
                          stroke: '#10b981',
                          name: 'Avg Score',
                        },
                      ]}
                      xAxisKey="name"
                      height={270}
                    />
                  </ChartContainer>
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
              <div className="h-[300px] w-full flex items-center justify-center">
                {scaleChartData.length > 0 ? (
                  <PieChart
                    data={scaleChartData}
                    dataKey="value"
                    nameKey="name"
                    height={270}
                    width={300}
                    innerRadius={54}
                    centerLabel={{ main: aggregate?.totalCount || 0, subLabel: 'companies' }}
                    labelType="percent"
                    showLegend={true}
                  />
                ) : (
                  <EmptyChartState message="No scale data" />
                )}
              </div>
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
            <div className="h-[300px]">
              {timeSeries.length > 0 ? (
                <ChartContainer className="h-full w-full">
                  <LineChart
                    data={timeSeries}
                    lines={[
                      {
                        dataKey: 'growth',
                        stroke: '#3b82f6',
                        name: 'New Assessments',
                      },
                    ]}
                    xAxisKey="period"
                    height={270}
                  />
                </ChartContainer>
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
            <div className="h-[350px]">
              {timeSeries.length > 0 ? (
                <ChartContainer className="h-full w-full">
                  <LineChart
                    data={timeSeries}
                    lines={[
                      {
                        dataKey: 'averageScore',
                        stroke: '#3b82f6',
                        name: 'Average Score',
                      },
                      {
                        dataKey: 'avgViability',
                        stroke: '#10b981',
                        name: 'Avg Viability',
                      },
                    ]}
                    xAxisKey="period"
                    height={320}
                  />
                </ChartContainer>
              ) : (
                <EmptyChartState message="No trend data" />
              )}
            </div>
          </ChartSection>

          {/* Key Insights */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Key Insights
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Recent Growth</p>
                    <p className="text-sm text-slate-600">
                      {trends.recentGrowth > 0
                        ? `${trends.recentGrowth} new assessments in recent weeks.`
                        : 'No recent assessments.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Score Improvement</p>
                    <p className="text-sm text-slate-600">
                      {trends.scoreImprovement !== 0
                        ? trends.scoreImprovement > 0
                          ? `Scores improved by ${trends.scoreImprovement.toFixed(1)} points`
                          : `Scores decreased by ${Math.abs(trends.scoreImprovement).toFixed(1)} points`
                        : 'Scores remain stable'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Industry Coverage</p>
                    <p className="text-sm text-slate-600">
                      {industryMetrics.length > 0
                        ? `${industryMetrics.length} active industries`
                        : 'No industry data yet'}
                    </p>
                  </div>
                </div>

                {/* Top 3 recommended actions (derived heuristics) */}
                <div className="pt-2 border-t mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Suggested next steps</p>
                      <p className="text-xs text-slate-500">
                        Personalised actions based on low-scoring sectors
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">Auto-generated</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(() => {
                      const low = (industryMetrics || [])
                        .slice()
                        .sort((a, b) => a.averageScore - b.averageScore)
                        .slice(0, 3);

                      if (!low || low.length === 0) {
                        return (
                          <div className="text-sm text-slate-500">No targeted actions needed</div>
                        );
                      }

                      const mapAction = (ind) => {
                        const label = ind.label || ind.industry;
                        const score = ind.averageScore?.toFixed(0) || ind.average_score || '—';
                        // heuristic mapping
                        const suggestion =
                          ind.averageScore <= 50
                            ? 'Prioritise product redesign & material recovery'
                            : ind.averageScore <= 70
                              ? 'Pilot reuse/recovery programs and partnerships'
                              : 'Maintain & scale best practices';
                        return { label, score, suggestion };
                      };

                      return low.map((l) => {
                        const info = mapAction(l);
                        return (
                          <Button
                            key={l.industry}
                            variant="info-soft"
                            size="sm"
                            className="min-w-[220px] text-sm"
                            onPress={() => setSelectedIndustries([l.industry])}
                          >
                            <div className="text-left">
                              <div className="font-medium text-slate-900">{info.label}</div>
                              <div className="text-xs text-slate-500">
                                {info.suggestion} — Avg {info.score}
                              </div>
                            </div>
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
