import React, { useMemo, useState, useCallback, memo } from 'react';
import { Card, Label, Chip, Tabs } from '@heroui/react';
import { Button } from '@/components/common';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/common/ChartWrapper';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
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
      <Card.Header className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <Card.Description className="text-xs">{title}</Card.Description>
          <Card.Title className="text-3xl font-bold mt-1">{value}</Card.Title>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
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
    <Card.Header className="flex flex-row items-center justify-between">
      <div className="flex-1">
        <Card.Title className="flex items-center gap-2 text-lg">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          {title}
        </Card.Title>
        {description && <Card.Description>{description}</Card.Description>}
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

  const { addToast } = useToast();

  // All available industries
  const { industryMetrics: allIndustryMetrics } = useEnhancedAnalytics({
    filters: { industry: 'all', timeRange: 'all' },
  });
  const industryOptions = useMemo(
    () => ['all', ...allIndustryMetrics.map((m) => m.industry)],
    [allIndustryMetrics],
  );

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
    if (!filteredIndustryMetrics || filteredIndustryMetrics.length === 0) return [];
    return filteredIndustryMetrics.map((m, idx) => ({
      ...m,
      color: pieColors[idx % pieColors.length],
      label: m.industry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [filteredIndustryMetrics]);

  // Helper for empty chart states
  const EmptyChartState = ({ message }) => (
    <div className="flex items-center justify-center h-full text-gray-400 text-base font-medium py-12">
      {message}
    </div>
  );

  // IndustryChipFilter for dashboard
  const renderIndustryChipFilter = () => (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-semibold text-slate-700">Filter by Industry</Label>
      <IndustryChipFilter
        industries={industryOptions}
        selected={selectedIndustries}
        onToggle={handleToggleIndustry}
        labelMap={industryLabelMap}
      />
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
        filters: { industry, timeRange },
        timeRangeOptions,
      });
      addToast('Dashboard exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addToast('Failed to export dashboard. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [industry, timeRange, timeRangeOptions, addToast]);

  const timeRangeLabel = useMemo(
    () => timeRangeOptions.find((option) => option.value === timeRange)?.label || 'Last 6 Months',
    [timeRange, timeRangeOptions],
  );

  const isBusy = isLoading || isFetching;

  return (
    <div
      id="dashboard-content"
      className={cn('space-y-6 transition-opacity duration-300', isBusy && 'opacity-60')}
    >
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Chip variant="secondary" color="default">
            <Chip.Label>
              <Sparkles className="w-3 h-3 inline mr-1" />
              Enhanced Analytics
            </Chip.Label>
          </Chip>
          <Chip variant="tertiary" color="default">
            <Chip.Label>
              {timeRange === 'all'
                ? 'All Time'
                : timeRange === '180d'
                  ? 'Last 6 Months'
                  : timeRange === '90d'
                    ? 'Last 3 Months'
                    : timeRange === '30d'
                      ? 'Last 30 Days'
                      : timeRange}
            </Chip.Label>
          </Chip>
        </div>
        <p className="text-sm text-gray-600">{renderStatus()}</p>
      </div>

      {/* Filter Bar */}
      <div
        id="dashboard-filter-bar"
        className="flex flex-col gap-3 p-4 border shadow-sm rounded-xl bg-white/80 backdrop-blur-sm md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {renderIndustryChipFilter()}
          <div className="min-w-[220px]">
            <p className="text-xs font-semibold uppercase text-gray-600 mb-2">Time Range</p>
            <Tabs
              selectedKey={timeRange}
              onSelectionChange={setTimeRange}
              variant="secondary"
              className="w-full"
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
        <div className="flex flex-wrap gap-2">
          <Button
            id="dashboard-export-button"
            variant="default"
            onClick={handleExportPDF}
            disabled={isExporting || isBusy}
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
          <Button variant="neutral-soft" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Key Metrics Grid */}
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

      {/* View-specific Content */}
      {viewMode === 'overview' && (
        <>
          {/* Trends and Distribution */}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <ChartSection
              title="Performance Trends"
              description="Score and viability trends over time"
              icon={Activity}
            >
              <div className={cn('w-full', isLoading && 'opacity-60')}>
                <ChartContainer config={trendConfig} className="h-[320px] w-full">
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area
                      type="monotone"
                      dataKey="averageScore"
                      stroke="#3b82f6"
                      fill="url(#scoreGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgViability"
                      stroke="#10b981"
                      fill="url(#viabilityGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </ChartSection>

            <ChartSection
              title="Score Distribution"
              description="Assessment score ranges"
              icon={PieChartIcon}
            >
              <div className="h-[320px]">
                {filteredPieChartData.length > 0 ? (
                  <PieChart
                    data={filteredPieChartData}
                    dataKey="value"
                    nameKey="name"
                    height={290}
                    colors={filteredPieChartData.map((d) => d.color)}
                    labelType="both"
                    label={({ name, value, percent }) =>
                      `${name} (${value}, ${(percent * 100).toFixed(0)}%)`
                    }
                    legend
                    legendPosition="bottom"
                  />
                ) : (
                  <EmptyChartState message="No distribution data" />
                )}
              </div>
            </ChartSection>
          </div>

          {/* Industry Performance */}
          <ChartSection
            title="Industry Performance"
            description="Average scores and assessment count by sector"
            icon={BarChart3}
          >
            <div className="h-[360px] w-full">
              {industryPerformanceData.length > 0 ? (
                <BarChart
                  data={industryPerformanceData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                  barSize={32}
                  barCategoryGap={24}
                  barGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={({ x, y, payload }) => {
                      const theme = INDUSTRY_THEMES[payload.value] || INDUSTRY_THEMES.general;
                      return (
                        <text
                          x={x}
                          y={y + 10}
                          textAnchor="end"
                          fill={theme.selectedText.replace('text-', '') || '#222'}
                          fontWeight="bold"
                          fontSize={12}
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar
                    dataKey="averageScore"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    name="Avg Score"
                    label={{ position: 'top', fill: '#222', fontWeight: 600, fontSize: 12 }}
                  />
                </BarChart>
              ) : (
                <EmptyChartState message="No industry data available for the selected filters." />
              )}
            </div>
          </ChartSection>
        </>
      )}

      {viewMode === 'detailed' && (
        <>
          {/* Detailed Industry Metrics */}
          <ChartSection
            title="Comprehensive Industry Analysis"
            description="Detailed metrics including viability, median, and score ranges"
            icon={BarChart3}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Industry</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Count</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Avg Score</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Viability</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Median</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Range</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Top Strategies
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {industryMetrics.map((metric) => (
                    <tr key={metric.industry} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{metric.industry}</td>
                      <td className="px-4 py-3 text-center">{metric.count}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {metric.averageScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{metric.avgViability.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{metric.median}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600">
                        {metric.min} - {metric.max}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {metric.topStrategies?.slice(0, 2).map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                            >
                              {s.strategy} ({s.count})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartSection>

          {/* Strategy and Scale Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSection
              title="R-Strategy Distribution"
              description="Circular economy strategies used"
              icon={Target}
            >
              <div className="h-[300px]">
                {strategyChartData.length > 0 ? (
                  <ComboChart
                    data={strategyChartData}
                    bars={[{ dataKey: 'value', fill: 'hsl(var(--chart-1))', name: 'Count' }]}
                    lines={[
                      {
                        dataKey: 'averageScore',
                        stroke: 'hsl(var(--chart-2))',
                        name: 'Avg Score',
                      },
                    ]}
                    xAxisKey="name"
                    height={270}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No strategy data
                  </div>
                )}
              </div>
            </ChartSection>

            <ChartSection
              title="Scale Distribution"
              description="Company size distribution"
              icon={Users}
            >
              <div className="h-[300px]">
                {scaleChartData.length > 0 ? (
                  <PieChart data={scaleChartData} dataKey="value" nameKey="name" height={270} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No scale data
                  </div>
                )}
              </div>
            </ChartSection>
          </div>
        </>
      )}

      {viewMode === 'trends' && (
        <>
          {/* Growth Trends */}
          <ChartSection
            title="Weekly Assessment Growth"
            description="New assessments submitted over time"
            icon={TrendingUp}
          >
            <div className="h-[300px]">
              {timeSeries.length > 0 ? (
                <LineChart
                  data={timeSeries}
                  lines={[
                    {
                      dataKey: 'growth',
                      stroke: 'hsl(var(--chart-1))',
                      name: 'New Assessments',
                    },
                  ]}
                  xAxisKey="period"
                  height={270}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No trend data
                </div>
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
                <LineChart
                  data={timeSeries}
                  lines={[
                    {
                      dataKey: 'averageScore',
                      stroke: 'hsl(var(--chart-1))',
                      name: 'Average Score',
                    },
                    {
                      dataKey: 'avgViability',
                      stroke: 'hsl(var(--chart-2))',
                      name: 'Avg Viability',
                    },
                  ]}
                  xAxisKey="period"
                  height={320}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No trend data
                </div>
              )}
            </div>
          </ChartSection>

          {/* Insights Panel */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Key Insights
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Recent Growth</p>
                    <p className="text-sm text-gray-600">
                      {trends.recentGrowth > 0
                        ? `${trends.recentGrowth} new assessments in the last 4 weeks, showing ${
                            trends.recentGrowth > 20 ? 'strong' : 'steady'
                          } adoption.`
                        : 'No recent assessments. Consider promoting the platform.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Score Improvement</p>
                    <p className="text-sm text-gray-600">
                      {trends.scoreImprovement > 0
                        ? `Average scores have improved by ${trends.scoreImprovement.toFixed(
                            1,
                          )} points, indicating better circularity practices.`
                        : trends.scoreImprovement < 0
                          ? `Scores have decreased by ${Math.abs(trends.scoreImprovement).toFixed(
                              1,
                            )} points. Review assessment criteria.`
                          : 'Scores remain stable over the analysis period.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Industry Coverage</p>
                    <p className="text-sm text-gray-600">
                      {industryMetrics.length > 0
                        ? `${industryMetrics.length} unique industries represented. ${
                            mostActiveIndustry
                              ? `${mostActiveIndustry.industry} leads with ${mostActiveIndustry.count} assessments.`
                              : ''
                          }`
                        : 'No industry data available yet.'}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </>
      )}
    </div>
  );
}
