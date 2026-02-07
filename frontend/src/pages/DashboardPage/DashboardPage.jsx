import React, { useMemo, useState } from 'react';
import { Card, Chip, Tabs, Button, Select, Label, ListBox } from '@heroui/react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/common/ChartWrapper';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Activity, Building2, Gauge, Layers, Download } from 'lucide-react';
import LoaderIcon from '@/components/common/LoaderIcon';
import { useGlobalAnalytics } from '@/features/assessments';
import { cn } from '@/utils/cn';
import { exportDashboardToPDF } from '@/lib/exportDashboard';
import { useToast } from '@/hooks/useToast';

// Simple card header components for semantic structure
const CardTitle = ({ children, className = '' }) => (
  <h3 className={`font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);

// Tabs subcomponents
const TabsList = ({ children, className = '' }) => (
  <div className={`flex border-b border-gray-200 gap-0 ${className}`} role="tablist">
    {children}
  </div>
);

const TabsTrigger = ({ value, children, onClick, className = '', ...props }) => (
  <button
    role="tab"
    data-value={value}
    className={`px-4 py-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 focus:outline-none transition-colors data-[active=true]:border-primary data-[active=true]:text-gray-900 flex-1 ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

const TabsContent = ({ value, isActive, children, className = '', ...props }) =>
  isActive && (
    <div role="tabpanel" className={className} {...props}>
      {children}
    </div>
  );

export default function DashboardPage() {
  const [industry, setIndustry] = useState('all');
  const [timeRange, setTimeRange] = useState('180d');
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { addToast } = useToast();
  const filters = useMemo(() => ({ industry, timeRange }), [industry, timeRange]);

  const { aggregate, industryMetrics, timeSeries, isLoading, isFetching, isError, error } =
    useGlobalAnalytics({ filters });

  const { industryMetrics: allIndustryMetrics } = useGlobalAnalytics({
    filters: { industry: 'all', timeRange: 'all' },
  });

  const timeRangeOptions = [
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '180d', label: 'Last 6 Months' },
    { value: 'all', label: 'All Time' },
  ];

  const industryOptions = useMemo(() => {
    const source = allIndustryMetrics.length ? allIndustryMetrics : industryMetrics;
    const unique = Array.from(
      new Set(source.map((metric) => metric.industry).filter((value) => value && value.length)),
    );
    return ['all', ...unique];
  }, [allIndustryMetrics, industryMetrics]);

  const mostActiveIndustry = useMemo(() => {
    if (!industryMetrics.length) return null;
    return industryMetrics.reduce((max, current) => (current.count > max.count ? current : max));
  }, [industryMetrics]);

  const formattedAverage = Number(aggregate.averageScore || 0).toFixed(1);

  const trendConfig = {
    averageScore: {
      label: 'Avg Score',
      color: 'hsl(var(--chart-1))',
    },
  };

  const sectorConfig = {
    averageScore: {
      label: 'Avg Score',
      color: 'hsl(var(--chart-2))',
    },
  };

  const renderStatus = () => {
    if (isLoading) return 'Loading analytics...';
    if (isError) return error || 'Unable to load analytics.';
    if (!aggregate.totalCount) return 'No assessments yet. Submit an audit to populate insights.';
    return 'Global performance snapshot across all assessments.';
  };

  const handleClearFilters = () => {
    setIndustry('all');
    setTimeRange('180d');
  };

  const handleExportPDF = async () => {
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
  };

  const timeRangeLabel =
    timeRangeOptions.find((option) => option.value === timeRange)?.label || 'Last 6 Months';

  const isBusy = isLoading || isFetching;

  return (
    <div
      id="dashboard-content"
      className={cn('space-y-6 transition-opacity', isBusy && 'opacity-60')}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Chip variant="secondary" color="default">
            <Chip.Label>Global Analytics</Chip.Label>
          </Chip>
          <Chip variant="tertiary" color="default">
            <Chip.Label>{timeRangeLabel}</Chip.Label>
          </Chip>
        </div>
        <p className="text-sm text-gray-600">{renderStatus()}</p>
      </div>

      <div
        id="dashboard-filter-bar"
        className="flex flex-col gap-3 p-4 border shadow-sm rounded-xl bg-white/80 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-[220px]">
            <p className="text-xs font-semibold uppercase text-gray-600">Industry</p>
            <Select
              className="mt-2 w-full"
              placeholder="Select industry"
              value={industry}
              onChange={(value) => setIndustry(value)}
            >
              <Label>Industry</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {industryOptions.map((option) => (
                    <ListBox.Item
                      key={option}
                      id={option}
                      textValue={option === 'all' ? 'All Industries' : option}
                    >
                      {option === 'all' ? 'All Industries' : option}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div className="min-w-[220px]">
            <p className="text-xs font-semibold uppercase text-gray-600">Time Range</p>
            <Select
              className="mt-2 w-full"
              placeholder="Select time range"
              value={timeRange}
              onChange={(value) => setTimeRange(value)}
            >
              <Label>Time Range</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {timeRangeOptions.map((option) => (
                    <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
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
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md bg-linear-to-br from-white to-slate-50">
          <Card.Header className="flex flex-row items-center justify-between">
            <div>
              <CardDescription>Total Audits</CardDescription>
              <CardTitle className="text-3xl font-bold">{aggregate.totalCount || 0}</CardTitle>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Layers className="w-6 h-6" />
            </div>
          </Card.Header>
          <Card.Content className="text-xs text-gray-600">
            Consolidated submissions across industries.
          </Card.Content>
        </Card>

        <Card className="border-0 shadow-md bg-linear-to-br from-white to-slate-50">
          <Card.Header className="flex flex-row items-center justify-between">
            <div>
              <CardDescription>Global Avg Score</CardDescription>
              <CardTitle className="text-3xl font-bold">{formattedAverage}</CardTitle>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600">
              <Gauge className="w-6 h-6" />
            </div>
          </Card.Header>
          <Card.Content className="text-xs text-gray-600">
            Average overall score for all assessments.
          </Card.Content>
        </Card>

        <Card className="border-0 shadow-md bg-linear-to-br from-white to-slate-50">
          <Card.Header className="flex flex-row items-center justify-between">
            <div>
              <CardDescription>Most Active Industry</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {mostActiveIndustry?.industry || 'N/A'}
              </CardTitle>
              <div className="mt-2">
                <Chip variant="secondary" color="default">
                  <Chip.Label>{mostActiveIndustry?.count || 0} audits</Chip.Label>
                </Chip>
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 text-indigo-600 rounded-full bg-indigo-500/10">
              <Building2 className="w-6 h-6" />
            </div>
          </Card.Header>
          <Card.Content className="text-xs text-gray-600">
            Highest volume of assessments by sector.
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-0 shadow-md">
          <Card.Header>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" /> Circular Trends
            </CardTitle>
            <CardDescription>Average score trajectory over the last 6 months.</CardDescription>
          </Card.Header>
          <Card.Content>
            <div className={cn('w-full', isLoading && 'opacity-60')}>
              <ChartContainer config={trendConfig} className="h-[320px] w-full">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-averageScore)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-averageScore)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    type="monotone"
                    dataKey="averageScore"
                    stroke="var(--color-averageScore)"
                    fill="url(#trendGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </Card.Content>
        </Card>

        <Card className="border-0 shadow-md">
          <Card.Header>
            <CardTitle className="text-lg">Insights</CardTitle>
            <CardDescription>Key takeaways from recent assessments.</CardDescription>
          </Card.Header>
          <Card.Content>
            <div className="w-full">
              <TabsList className="w-full">
                <TabsTrigger
                  value="overview"
                  className="flex-1"
                  onClick={() => setActiveTab('overview')}
                  data-active={activeTab === 'overview'}
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="sectors"
                  className="flex-1"
                  onClick={() => setActiveTab('sectors')}
                  data-active={activeTab === 'sectors'}
                >
                  Sectors
                </TabsTrigger>
              </TabsList>
              {activeTab === 'overview' && (
                <div className="mt-4 space-y-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Average score</p>
                    <p className="text-2xl font-semibold text-gray-900">{formattedAverage}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Total submissions</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {aggregate.totalCount || 0}
                    </p>
                  </div>
                </div>
              )}
              {activeTab === 'sectors' && (
                <div className="mt-4 space-y-3">
                  {industryMetrics.length ? (
                    industryMetrics.slice(0, 4).map((metric) => (
                      <div
                        key={metric.industry}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{metric.industry}</p>
                          <p className="text-xs text-gray-600">{metric.count} audits</p>
                        </div>
                        <Chip variant="secondary" color="default">
                          <Chip.Label>{metric.averageScore.toFixed(1)}</Chip.Label>
                        </Chip>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">
                      No industry data yet. New audits will appear here.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <Card.Header>
          <CardTitle className="text-lg">Performance by Sector</CardTitle>
          <CardDescription>Average score by industry segment.</CardDescription>
        </Card.Header>
        <Card.Content>
          <ChartContainer config={sectorConfig} className="h-[360px] w-full">
            <BarChart data={industryMetrics} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="industry"
                tickLine={false}
                axisLine={false}
                angle={-20}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="averageScore" fill="var(--color-averageScore)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card.Content>
      </Card>
    </div>
  );
}
