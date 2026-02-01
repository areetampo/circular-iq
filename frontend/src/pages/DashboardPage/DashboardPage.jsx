import React, { useMemo, useState } from 'react';
import AppContainer from '@/components/layout/AppContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Activity, Building2, Gauge, Layers, Download, Loader2 } from 'lucide-react';
import { useGlobalAnalytics } from '@/features/assessments';
import { cn } from '@/lib/utils';
import { exportDashboardToPDF } from '@/lib/exportDashboard';
import { useToast } from '@/hooks/useToast';

export default function DashboardPage() {
  const [industry, setIndustry] = useState('all');
  const [timeRange, setTimeRange] = useState('180d');
  const [isExporting, setIsExporting] = useState(false);

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
    <AppContainer
      headerProps={{
        title: 'Global Dashboard',
        subtitle: 'Track circular economy performance across all assessments.',
        showLogo: true,
      }}
    >
      <div
        id="dashboard-content"
        className={cn('space-y-6 transition-opacity', isBusy && 'opacity-60')}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Global Analytics</Badge>
            <Badge variant="outline">{timeRangeLabel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{renderStatus()}</p>
        </div>

        <div
          id="dashboard-filter-bar"
          className="flex flex-col gap-3 rounded-xl border bg-white/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="min-w-[220px]">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Industry</p>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'all' ? 'All Industries' : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[220px]">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Time Range</p>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
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
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardDescription>Total Audits</CardDescription>
                <CardTitle className="text-3xl font-bold">{aggregate.totalCount || 0}</CardTitle>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Layers className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Consolidated submissions across industries.
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardDescription>Global Avg Score</CardDescription>
                <CardTitle className="text-3xl font-bold">{formattedAverage}</CardTitle>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Gauge className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Average overall score for all assessments.
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardDescription>Most Active Industry</CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {mostActiveIndustry?.industry || 'N/A'}
                </CardTitle>
                <div className="mt-2">
                  <Badge variant="secondary">{mostActiveIndustry?.count || 0} audits</Badge>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                <Building2 className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Highest volume of assessments by sector.
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" /> Circular Trends
              </CardTitle>
              <CardDescription>Average score trajectory over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn('w-full', isLoading && 'opacity-60')}>
                <ChartContainer config={trendConfig} className="h-[320px] w-full">
                  <AreaChart data={timeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-averageScore)" stopOpacity={0.4} />
                        <stop
                          offset="95%"
                          stopColor="var(--color-averageScore)"
                          stopOpacity={0.05}
                        />
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
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Insights</CardTitle>
              <CardDescription>Key takeaways from recent assessments.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="sectors" className="flex-1">
                    Sectors
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4 space-y-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Average score</p>
                    <p className="text-2xl font-semibold text-foreground">{formattedAverage}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Total submissions</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {aggregate.totalCount || 0}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="sectors" className="mt-4 space-y-3">
                  {industryMetrics.length ? (
                    industryMetrics.slice(0, 4).map((metric) => (
                      <div
                        key={metric.industry}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{metric.industry}</p>
                          <p className="text-xs text-muted-foreground">{metric.count} audits</p>
                        </div>
                        <Badge variant="secondary">{metric.averageScore.toFixed(1)}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No industry data yet. New audits will appear here.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Performance by Sector</CardTitle>
            <CardDescription>Average score by industry segment.</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Bar
                  dataKey="averageScore"
                  fill="var(--color-averageScore)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </AppContainer>
  );
}
