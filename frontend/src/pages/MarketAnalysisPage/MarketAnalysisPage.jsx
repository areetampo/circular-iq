import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoaderComponent from '@/components/common/LoaderComponent';
import BarChart from '@/components/charts/BarChart';
import ScatterChart from '@/components/charts/ScatterChart';
import LineChart from '@/components/charts/LineChart';
import { titleize } from '@/lib/formatting';
import { getCurrentTimestampFormatted } from '@/lib/formatting';
import { useMarketAnalysis, getEnhancedAnalytics } from '@/features/assessments';
import { useQuery } from '@tanstack/react-query';
import { exportAssessmentPDF } from '@/features/export';
import { Card, Chip } from '@heroui/react';
import { Button } from '@/components/common';
import { Progress } from '@heroui/progress';
import {
  ChevronLeft,
  Sparkles,
  BarChart3,
  TrendingUp,
  Target,
  Star,
  Trophy,
  Lightbulb,
  Briefcase,
  ArrowRight,
  Download,
  Info,
} from 'lucide-react';

export default function MarketAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filterScale, setFilterScale] = useState('all');
  const [timeRange, setTimeRange] = useState('12m');
  const [granularity, setGranularity] = useState('monthly');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Fetch market analysis data using hook
  const {
    marketData,
    stats,
    userScore,
    userIndustry,
    userPercentile: apiUserPercentile,
    industryBenchmark,
    strategyBreakdown,
    isLoading,
    isError,
    error,
    refetch,
  } = useMarketAnalysis({
    assessmentId: id,
    enabled: true,
  });

  // Fetch industry trend data for a small time-series chart (respects selected timeRange and granularity)
  const { data: trendData } = useQuery({
    queryKey: ['market-trend', userIndustry, timeRange, granularity],
    queryFn: async () => {
      if (!userIndustry) return { timeSeries: [] };
      const data = await getEnhancedAnalytics({ industry: userIndustry, timeRange, granularity });
      return data || { timeSeries: [] };
    },
    enabled: !!userIndustry && !!timeRange,
  });

  const industryTrend = (trendData && trendData.timeSeries) || [];

  const lines = React.useMemo(() => {
    const base = [{ dataKey: 'averageScore', stroke: '#34a83a', name: 'Avg Score' }];
    if (industryTrend && industryTrend.length && industryTrend[0].confidenceUpper != null) {
      // Add confidence interval band (upper/lower) as a band entry and keep the avg line
      base.push({
        dataKey: 'confidenceUpper',
        stroke: '#9CA3AF',
        name: 'Upper CI',
        strokeDasharray: '4 4',
        strokeOpacity: 0.8,
        dot: false,
      });
      base.push({
        dataKey: 'confidenceLower',
        stroke: '#9CA3AF',
        name: 'Lower CI',
        strokeDasharray: '4 4',
        strokeOpacity: 0.8,
        dot: false,
      });

      base.push({
        band: true,
        id: 'ci',
        upperKey: 'confidenceUpper',
        lowerKey: 'confidenceLower',
        fill: '#e6f4ea',
        fillOpacity: 0.9,
      });
    }
    return base;
  }, [industryTrend]);

  const getIndustryColor = (industry) => {
    const colors = {
      packaging: '#FF6B6B',
      food_waste: '#4ECDC4',
      energy: '#FFE66D',
      textiles: '#95E1D3',
      electronics: '#F38181',
      construction: '#AA96DA',
      agriculture: '#90EE90',
      water: '#87CEEB',
      general: '#D3D3D3',
    };
    return colors[industry] || '#999';
  };

  // Prepare data for scatter plot - memoized to prevent expensive recalculations
  const scatterChartData = useMemo(
    () =>
      marketData
        .filter((item) => filterScale === 'all' || item.scale === filterScale)
        .map((item, idx) => ({
          x: item.avg_score || 0,
          y: idx,
          industry: item.industry || 'General',
          scale: item.scale || 'Medium',
          count: item.count,
          fill: getIndustryColor(item.industry),
        })),
    [marketData, filterScale],
  );

  const getScales = () => {
    const scales = new Set(marketData.map((d) => d.scale).filter(Boolean));
    return ['all', ...Array.from(scales)];
  };

  const userPercentile =
    apiUserPercentile != null
      ? apiUserPercentile
      : stats
        ? Math.round(
            (((userScore || 0) - (stats.min_score || 0)) /
              ((stats.max_score || 100) - (stats.min_score || 0))) *
              100,
          )
        : 0;

  // Prepare data for BarChart component - memoized to prevent expensive recalculations
  const barChartData = useMemo(
    () =>
      marketData
        .filter((item) => filterScale === 'all' || item.scale === filterScale)
        .sort((a, b) => b.avg_score - a.avg_score)
        .slice(0, 10)
        .map((item) => ({
          name: titleize(item.industry),
          avgScore: item.avg_score,
          count: item.count,
        })),
    [marketData, filterScale],
  );

  const barConfigs = [
    {
      dataKey: 'avgScore',
      fill: '#34a83a',
      name: 'Average Score',
    },
  ];

  const strategyChartData = useMemo(() => {
    if (!strategyBreakdown || !strategyBreakdown.length) return [];
    return strategyBreakdown.map((s) => ({
      name: titleize(s.strategy),
      avgScore: Number(s.avg_score || 0),
      count: s.count || 0,
    }));
  }, [strategyBreakdown]);

  const industryBenchmarkScore = useMemo(() => {
    if (!marketData.length) return stats?.avg_score ?? null;
    if (!userIndustry) return stats?.avg_score ?? null;
    const match = marketData.find((item) => item.industry === userIndustry);
    return match?.avg_score ?? stats?.avg_score ?? null;
  }, [marketData, userIndustry, stats]);

  const normalizedUserScore = typeof userScore === 'number' ? userScore : null;
  const normalizedBenchmarkScore =
    typeof industryBenchmarkScore === 'number' ? industryBenchmarkScore : null;

  const benchmarkDeltaPercent =
    normalizedUserScore != null && normalizedBenchmarkScore != null && normalizedBenchmarkScore > 0
      ? Math.round(
          ((normalizedUserScore - normalizedBenchmarkScore) / normalizedBenchmarkScore) * 100,
        )
      : null;

  const isOutperforming =
    normalizedUserScore != null &&
    normalizedBenchmarkScore != null &&
    normalizedUserScore >= normalizedBenchmarkScore;

  const userIndicatorPosition =
    normalizedUserScore != null
      ? Math.min(100, Math.max(0, Math.round(normalizedUserScore)))
      : null;

  const industryLabel = userIndustry ? titleize(userIndustry) : 'your industry';
  const primaryPillarMap = {
    packaging: 'packaging circularity',
    food_waste: 'waste-to-value recovery',
    energy: 'renewable energy integration',
    textiles: 'material circularity',
    electronics: 'component reuse',
    construction: 'material efficiency',
    agriculture: 'regenerative practices',
    water: 'resource efficiency',
    general: 'circular design',
  };
  const specificAreaMap = {
    packaging: 'packaging recovery systems',
    food_waste: 'supply chain diversion',
    energy: 'distributed energy scaling',
    textiles: 'fiber reuse programs',
    electronics: 'reverse logistics',
    construction: 'low-waste procurement',
    agriculture: 'soil health initiatives',
    water: 'reuse infrastructure',
    general: 'material efficiency',
  };
  const primaryPillar = primaryPillarMap[userIndustry] || 'circular design';
  const specificArea = specificAreaMap[userIndustry] || 'material efficiency';

  const handleBackToResults = () => {
    navigate(`/results/${id}`);
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      const title = `Market Analysis - ${titleize(userIndustry || 'All')}`;
      // We re-use the assessment PDF export utility by passing a small context object and target element
      await exportAssessmentPDF(
        { title, created_at: new Date().toISOString() },
        { elementId: 'market-analysis-content' },
      );
    } catch (err) {
      console.error('Failed to export Market Analysis PDF', err);
      // graceful fallback: try printing the current page
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Industry', 'Scale', 'Avg Score', 'Min Score', 'Max Score', 'Projects', 'Strategy'],
    ];
    (marketData || []).forEach((m) => {
      rows.push([
        m.industry || '',
        m.scale || '',
        m.avg_score ?? '',
        m.min_score ?? '',
        m.max_score ?? '',
        m.count ?? '',
        m.r_strategy || '',
      ]);
    });
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${id || 'all'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Back Button */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="neutral-soft" onClick={handleBackToResults} aria-label="Back to results">
          <ChevronLeft className="w-4 h-4" />
          Back to Results
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="teal-soft"
            onPress={handleExportCSV}
            aria-label="Export market data as CSV"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button
            variant="neutral"
            onPress={handleExportPDF}
            aria-label="Export market analysis as PDF"
          >
            <Download className="w-4 h-4 mr-2" /> {isExportingPDF ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoaderComponent />
        </div>
      ) : isError ? (
        <div className="p-4 text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 mt-4 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div id="market-analysis-content" className="space-y-6">
          {/* Header Section */}
          <div className="p-6 bg-linear-to-r from-primary-500 to-primary-600 rounded-2xl text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <BarChart3 className="w-8 h-8 text-white" strokeWidth={2.5} /> Market Landscape
            </h1>
            <p className="mt-2 text-lg opacity-90">
              Benchmark your circular economy initiative against the broader market
            </p>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                <div className="flex justify-center mb-2 text-3xl">
                  <TrendingUp className="w-9 h-9 text-primary-500" strokeWidth={2} />
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-2xl font-bold text-primary-500">
                  {stats.avg_score.toFixed(1)}
                </div>
              </div>
              <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                <div className="flex justify-center mb-2 text-3xl">
                  <Target className="w-9 h-9 text-primary-500" strokeWidth={2} />
                </div>
                <div className="text-sm text-gray-600">Median Score</div>
                <div className="text-2xl font-bold text-primary-500">
                  {stats.median_score.toFixed(1)}
                </div>
              </div>
              <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                <div className="flex justify-center mb-2 text-3xl">
                  <BarChart3 className="w-9 h-9 text-[#2c3e50]" strokeWidth={2} />
                </div>
                <div className="text-sm text-gray-600">Total Projects</div>
                <div className="text-2xl font-bold text-[#2c3e50]">{stats.total_count}</div>
              </div>
              {userScore != null && (
                <div className="p-5 bg-linear-to-br from-[#fff9e6] to-[#fffbf0] border-2 border-accent-500 shadow-md rounded-xl">
                  <div className="flex justify-center mb-2 text-3xl">
                    <Star className="w-9 h-9 text-accent-500" strokeWidth={2} fill="#ff9800" />
                  </div>
                  <div className="text-sm text-gray-600">Your Percentile</div>
                  <div className="text-2xl font-bold text-accent-500">{userPercentile}th</div>
                </div>
              )}
            </div>
          )}

          {/* Market volatility & industry share */}
          {trendData && ( // trendData comes from enhanced analytics and includes overallVolatility and industryMarketShare
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">Market Volatility (std dev)</div>
                  <Info
                    className="w-4 h-4 text-gray-400"
                    title="Standard deviation of average scores across the selected market"
                    aria-hidden="true"
                  />
                </div>
                <div className="text-2xl font-bold text-primary-500">
                  {trendData.overallVolatility != null ? `${trendData.overallVolatility}` : 'N/A'}
                </div>
                {industryTrend && industryTrend.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Latest ({industryTrend[industryTrend.length - 1].label}):{' '}
                    <strong>{industryTrend[industryTrend.length - 1].averageScore}</strong> (
                    {industryTrend[industryTrend.length - 1].confidenceLower}–
                    {industryTrend[industryTrend.length - 1].confidenceUpper})
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Lower is better — reflects score dispersion across the market.
                </div>
              </div>
              <div className="p-4 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                <div className="text-sm text-gray-600">Industry Market Share</div>
                <div className="text-2xl font-bold text-primary-500">
                  {trendData.industryMarketShare != null
                    ? `${trendData.industryMarketShare}%`
                    : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Industry Benchmarking */}
          <Card className="border shadow-sm border-slate-200">
            <Card.Header className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Card.Title className="text-xl font-semibold text-[#1f2937]">
                  Industry Benchmarking
                </Card.Title>
                {normalizedUserScore != null && normalizedBenchmarkScore != null && (
                  <Chip variant="soft" color={isOutperforming ? 'success' : 'warning'}>
                    \n {isOutperforming ? 'Outperforming' : 'Opportunity for Growth'}
                  </Chip>
                )}
              </div>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Industry Average</span>
                  <span className="font-semibold text-slate-700">
                    {normalizedBenchmarkScore != null
                      ? `${normalizedBenchmarkScore.toFixed(1)} / 100`
                      : 'Unavailable'}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={normalizedBenchmarkScore != null ? normalizedBenchmarkScore : 0}
                    color="primary"
                    classNames={{
                      track: 'h-3 bg-primary-100',
                      indicator: 'bg-primary-500',
                    }}
                  />
                  {userIndicatorPosition != null && (
                    <div
                      className="absolute -top-1.5 h-6 w-0.5 bg-primary-600"
                      style={{ left: `${userIndicatorPosition}%` }}
                      aria-label="User score indicator"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                {benchmarkDeltaPercent == null ? (
                  'Industry comparison is unavailable for this assessment.'
                ) : (
                  <span>
                    Your score is{' '}
                    <strong className="text-[#059669]">{Math.abs(benchmarkDeltaPercent)}%</strong>{' '}
                    {benchmarkDeltaPercent >= 0 ? 'higher' : 'lower'} than the industry average
                    {userIndustry ? ` for ${titleize(userIndustry)}` : ''}.
                  </span>
                )}
                {industryBenchmark && (
                  <div className="mt-3 text-sm text-slate-700">
                    Industry benchmark for <strong>{titleize(userIndustry)}</strong>:{' '}
                    <strong className="text-primary-500">
                      {industryBenchmark.avg_score.toFixed(1)} / 100
                    </strong>{' '}
                    ({industryBenchmark.count} projects)
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Filter & Time Range Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {getScales().length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Filter by Scale:</span>
                {getScales().map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setFilterScale(scale)}
                    aria-pressed={filterScale === scale}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterScale === scale
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {titleize(scale)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Time range:</span>
              {['all', '12m', '24m', '36m'].map((tr) => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  aria-pressed={timeRange === tr}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    timeRange === tr
                      ? 'bg-primary-50 text-primary-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tr === 'all' ? 'All' : tr}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Granularity:</span>
              {['weekly', 'monthly', 'daily'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  aria-pressed={granularity === g}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    granularity === g
                      ? 'bg-primary-50 text-primary-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Section - Top Industries */}
          {barChartData.length > 0 && (
            <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
              <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[#4a90e2]" strokeWidth={2.5} /> Top Industries by
                Average Score
              </h2>
              <BarChart
                data={barChartData}
                barConfigs={barConfigs}
                height={400}
                showLegend={false}
                showGrid={true}
                yAxisDomain={[0, 100]}
                yAxisLabel="Average Score"
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Score Distribution Scatter Plot */}
          {scatterChartData.length > 0 && (
            <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
              <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#4a90e2]" strokeWidth={2.5} /> Score Distribution
                by Industry
              </h2>
              <ScatterChart
                data={scatterChartData}
                height={400}
                xAxisLabel="Average Score"
                xDomain={[0, 100]}
                yDomain={[0, scatterChartData.length]}
                showGrid={true}
                isLoading={isLoading}
                customTooltip={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/98 p-3 px-4 border border-gray-300 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                      <p className="m-0 mb-2 font-semibold text-[13px] text-slate-800 capitalize">
                        {titleize(data.industry)}
                      </p>
                      <p className="m-0 mb-1 text-xs text-slate-500">
                        <strong>Score:</strong> {data.x.toFixed(1)} / 100
                      </p>
                      <p className="m-0 mb-1 text-xs text-slate-500">
                        <strong>Scale:</strong> {titleize(data.scale)}
                      </p>
                      <p className="m-0 text-xs text-slate-500">
                        <strong>Projects:</strong> {data.count}
                      </p>
                    </div>
                  );
                }}
              />
              <div className="flex flex-wrap gap-6 pt-6 mt-6 border-t border-gray-300">
                {[...new Set(scatterChartData.map((d) => d.industry))].map((industry) => (
                  <div key={industry} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: getIndustryColor(industry) }}
                    />
                    <span className="text-sm text-gray-600">{titleize(industry)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Industry Benchmarks Table */}
          {marketData.length > 0 && (
            <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)] overflow-x-auto">
              <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent-500" strokeWidth={2.5} /> Industry Benchmarks
              </h2>

              {/* Strategy Breakdown Chart */}
              {strategyChartData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Strategy Breakdown</h3>
                  <div className="w-full h-56">
                    <BarChart
                      data={strategyChartData}
                      barConfigs={[{ dataKey: 'avgScore', fill: '#1f78b4', name: 'Avg Score' }]}
                      height={220}
                      showLegend={false}
                      showGrid={true}
                      yAxisDomain={[0, 100]}
                      yAxisLabel="Avg Score"
                    />
                  </div>
                </div>
              )}

              {/* Industry Trend (time series) */}
              {industryTrend && industryTrend.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Industry Trend</h3>
                  <div className="w-full h-48">
                    <LineChart
                      data={industryTrend}
                      lines={lines}
                      xAxisKey="label"
                      height={200}
                      ariaLabel={`Industry trend for ${titleize(userIndustry || 'All')} (${granularity})`}
                    />
                  </div>
                </div>
              )}

              <table className="w-full border-collapse text-[0.85rem] md:text-[0.95rem]">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-2 md:px-3 py-2 md:py-3 pl-4 text-left border-b border-gray-300 font-bold text-[#2c3e50]">
                      Industry
                    </th>
                    <th className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]">
                      Scale
                    </th>
                    <th className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]">
                      Projects
                    </th>
                    <th className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]">
                      Avg Score
                    </th>
                    <th className="px-2 md:px-3 py-2 md:py-3 pr-4 text-left border-b border-gray-300 font-bold text-[#2c3e50]">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {marketData
                    .filter((item) => filterScale === 'all' || item.scale === filterScale)
                    .sort((a, b) => b.avg_score - a.avg_score)
                    .map((item, idx) => (
                      <tr key={idx} className="even:bg-gray-100 hover:bg-[#f5f9f5]">
                        <td className="px-2 md:px-3 py-2 md:py-3 pl-4 text-left border-b border-gray-300 font-semibold text-[#2c3e50]">
                          <span className="inline-flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: getIndustryColor(item.industry),
                              }}
                            />
                            {titleize(item.industry)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-left border-b border-gray-300 md:px-3 md:py-3">
                          {titleize(item.scale)}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600 border-b border-gray-300 md:px-3 md:py-3">
                          {item.count}
                        </td>
                        <td className="px-2 py-2 text-center border-b border-gray-300 md:px-3 md:py-3">
                          <span className="inline-block bg-primary-50 px-3 py-1 rounded font-bold text-primary-500">
                            {item.avg_score.toFixed(1)} / 100
                          </span>
                        </td>
                        <td className="px-2 py-2 pr-4 text-sm text-center text-gray-600 border-b border-gray-300 md:px-3 md:py-3">
                          <span className="inline-flex items-center gap-1">
                            {item.min_score}{' '}
                            <ArrowRight className="w-3 h-3 text-gray-600" strokeWidth={2} />{' '}
                            {item.max_score}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Key Insights */}
          <div className="bg-linear-to-br from-[#fff9e6] to-[#fffbf0] py-7 px-7 rounded-[10px] border-2 border-accent-500 shadow-[0_8px_24px_rgba(255,152,0,0.1)]">
            <h2 className="text-[#ff6f00] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-[#ff6f00]" strokeWidth={2.5} /> Key Market Insights
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
              <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="flex mb-3 text-2xl">
                  <Target className="w-7 h-7 text-accent-500" strokeWidth={2} />
                </div>
                <div className="text-base font-bold text-[#2c3e50] mb-2">Top Performers</div>
                <div className="text-[0.85rem] text-gray-700 leading-6">
                  Projects in <strong>Energy</strong> and <strong>Water</strong> industries tend to
                  score highest on circular economy metrics
                </div>
              </div>
              <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="flex mb-3 text-2xl">
                  <TrendingUp className="w-7 h-7 text-accent-500" strokeWidth={2} />
                </div>
                <div className="text-base font-bold text-[#2c3e50] mb-2">Growth Opportunity</div>
                <div className="text-[0.85rem] text-gray-700 leading-6">
                  Emerging industries show varied scores—there&apos;s significant room for
                  specialized innovation and differentiation
                </div>
              </div>
              <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="flex mb-3 text-2xl">
                  <Briefcase className="w-7 h-7 text-accent-500" strokeWidth={2} />
                </div>
                <div className="text-base font-bold text-[#2c3e50] mb-2">Scale Factor</div>
                <div className="text-[0.85rem] text-gray-700 leading-6">
                  Larger, commercial-stage projects generally score higher than prototypes and
                  early-stage initiatives
                </div>
              </div>
              <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <div className="flex mb-3 text-2xl">
                  <Star className="w-7 h-7 text-accent-500" strokeWidth={2} fill="#ff9800" />
                </div>
                <div className="text-base font-bold text-[#2c3e50] mb-2">Your Advantage</div>
                <div className="text-[0.85rem] text-gray-700 leading-6">
                  Focus on your unique circular strategy and value proposition to differentiate in
                  your market segment
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategic Insight */}
          <Card className="border shadow-sm border-slate-200 bg-sky-50/70">
            <Card.Header className="pb-2">
              <Card.Title className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                <Sparkles className="w-5 h-5 text-sky-500" />
                Strategic Recommendation
              </Card.Title>
            </Card.Header>
            <Card.Content className="text-sm leading-6 text-slate-700">
              {isOutperforming ? (
                <span>
                  Your circular strategy is leading the {industryLabel} sector. To maintain this
                  advantage, focus on scaling your <strong>{primaryPillar}</strong> to increase
                  market share.
                </span>
              ) : (
                <span>
                  You are currently trailing the industry average for {industryLabel}. Prioritizing{' '}
                  <strong>{specificArea}</strong> could bridge the gap and improve your competitive
                  standing.
                </span>
              )}
            </Card.Content>
          </Card>

          {/* Footer */}
          <div className="mt-6 text-sm text-center text-gray-500">
            Last updated:&nbsp;
            {getCurrentTimestampFormatted()}
          </div>
        </div>
      )}
    </div>
  );
}
