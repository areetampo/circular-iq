import { Card, Chip, ProgressBar, ProgressCircle, Tab, Table, Tabs, Tooltip } from '@heroui/react';
import { Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Briefcase,
  ChevronLeft,
  Download,
  Info,
  Lightbulb,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import ScatterChart from '@/components/charts/ScatterChart';
import { Button } from '@/components/common';
import LoaderComponent from '@/components/common/LoaderComponent';
import { getEnhancedAnalytics, useDocumentStats, useMarketAnalysis } from '@/features/assessments';
import { exportAssessmentPDF } from '@/features/export';
import { useSession } from '@/features/session';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentTimestampFormatted, titleize } from '@/lib/formatting';
import { getIndustry } from '@/lib/metadata';

export default function MarketAnalysisPage({
  isPublicShare = false,
  isViewFromMyAssessments = false,
}) {
  const { id, publicId } = useParams();
  const navigate = useNavigate();
  const [filterScale, setFilterScale] = useState('all');
  const [timeRange, setTimeRange] = useState('12m');
  const [granularity, setGranularity] = useState('monthly');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Auth state to control export access
  const { user } = useAuth();

  // Fetch market analysis data using hook for aggregate/assessment/public cases
  const {
    marketData,
    stats,
    userScore: apiUserScore,
    userIndustry: apiUserIndustry,
    userPercentile: apiUserPercentile,
    industryBenchmark: apiIndustryBenchmark,
    strategyBreakdown,
    isLoading,
    isError,
    error,
    refetch,
  } = useMarketAnalysis({
    assessmentId: isPublicShare ? null : id,
    publicId: isPublicShare ? publicId || id : null,
    enabled: true,
  });

  // Support session-based (unsaved) market analysis when visiting `/results/market-analysis`.
  // Use session_evaluation_state.results when present (works for authenticated or anonymous users).
  const { restoreEvaluation } = useSession();
  const sessionEval = restoreEvaluation();
  const sessionResult = sessionEval?.results || null;

  // Determine which userScore / industry to show (session result takes precedence
  // for the session-based route `/results/market-analysis`).
  const isSessionView = !id && !isPublicShare && !!sessionResult;
  const userScore = isSessionView ? (sessionResult.overall_score ?? apiUserScore) : apiUserScore;
  const userIndustry = isSessionView
    ? (function () {
        try {
          return getIndustry(sessionResult) || apiUserIndustry;
        } catch (e) {
          return sessionResult?.industry || sessionResult?.metadata?.industry || apiUserIndustry;
        }
      })()
    : apiUserIndustry;

  // If session-based, compute percentile & industryBenchmark client-side using stats/marketData
  const computedUserPercentile = React.useMemo(() => {
    if (!isSessionView || typeof userScore !== 'number' || !stats) return apiUserPercentile ?? null;
    const min = stats.min_score ?? 0;
    const max = stats.max_score ?? 100;
    if (max === min) return 50;
    return Math.round(((userScore - min) / (max - min)) * 100);
  }, [isSessionView, userScore, stats, apiUserPercentile]);

  const computedIndustryBenchmark = React.useMemo(() => {
    if (!isSessionView || !userIndustry || !Array.isArray(marketData)) return apiIndustryBenchmark;
    const match = marketData.find((m) => m.industry === userIndustry);
    if (!match) return apiIndustryBenchmark || null;
    return {
      avg_score: match.avg_score,
      min_score: match.min_score,
      max_score: match.max_score,
      count: match.count,
      scale: match.scale,
    };
  }, [isSessionView, userIndustry, marketData, apiIndustryBenchmark]);

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

  // New document stats hook
  const { stats: documentStats, loading: statsLoading, error: statsError } = useDocumentStats();

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
      manufacturing: '#B19CD9',
      retail: '#FFB347',
      automotive: '#77DD77',
      chemicals: '#AEC6CF',
      mining: '#CFCFC4',
      hospitality: '#FDFD96',
      logistics: '#FF6961',
      healthcare: '#84B082',
      technology: '#9B59B6',
    };
    if (industry && colors[industry]) return colors[industry];
    const hash = (s) => {
      let h = 0;
      for (let i = 0; i < (s || '').length; i++) h = (h << 5) - h + s.charCodeAt(i);
      return Math.abs(h);
    };
    const palette = [
      '#4ECDC4',
      '#FF6B6B',
      '#AA96DA',
      '#95E1D3',
      '#F38181',
      '#87CEEB',
      '#FFE66D',
      '#90EE90',
    ];
    return palette[hash(industry) % palette.length];
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
      [
        'Industry',
        'Scale',
        'Avg Score',
        'Min Score',
        'Max Score',
        'Avg Confidence',
        'Avg Technical Feasibility',
        'Avg Economic Viability',
        'Avg Circularity Potential',
        'Projects',
        'Strategy',
      ],
    ];
    (marketData || []).forEach((m) => {
      rows.push([
        m.industry || '',
        m.scale || '',
        m.avg_score ?? '',
        m.min_score ?? '',
        m.max_score ?? '',
        m.avg_confidence ?? '',
        m.avg_tech_feas ?? '',
        m.avg_econ_viab ?? '',
        m.avg_circ_pot ?? '',
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
        <Button variant="neutral-soft" onClick={() => navigate(-1)} aria-label="Back to results">
          <ChevronLeft size={16} />
          Back
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {/* Export buttons: visible to everyone but disabled for anonymous users */}
          <Tooltip delay={0} placement="top" isDisabled={!!user}>
            <Tooltip.Trigger>
              <Button
                variant="teal-soft"
                onPress={user ? handleExportCSV : undefined}
                isDisabled={!user}
                disabled={!user}
                aria-label="Export market data as CSV"
                title={!user ? 'Sign in to get access to them' : undefined}
              >
                <Download className="mr-2" size={16} /> Export CSV
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <p className="text-xs font-bold">
                {user ? 'Export market data as CSV' : 'Sign in to get access to them'}
              </p>
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={0} placement="top" isDisabled={!!user}>
            <Tooltip.Trigger>
              <Button
                variant="neutral"
                onPress={user ? handleExportPDF : undefined}
                isDisabled={!user || isExportingPDF}
                disabled={!user || isExportingPDF}
                aria-label="Export market analysis as PDF"
                title={!user ? 'Sign in to get access to them' : undefined}
              >
                <Download className="mr-2" size={16} />{' '}
                {isExportingPDF ? 'Exporting...' : 'Export PDF'}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <p className="text-xs font-bold">
                {user
                  ? isExportingPDF
                    ? 'Exporting...'
                    : 'Export PDF'
                  : 'Sign in to get access to them'}
              </p>
            </Tooltip.Content>
          </Tooltip>
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
          <Tabs aria-label="Market Analysis Tabs" className="w-full">
            <Tab key="assessment-insights" title="Assessment Insights">
              <div className="space-y-6 mt-6">
                {/* Header Section */}
                <div className="p-6 bg-linear-to-r from-primary-500 to-primary-600 rounded-2xl text-white shadow-lg">
                  <h1 className="flex items-center gap-2 text-3xl font-bold">
                    <BarChart3 className="text-white" strokeWidth={2.5} size={32} /> Market
                    Landscape
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
                        <TrendingUp className="text-primary-500" strokeWidth={2} size={36} />
                      </div>
                      <div className="text-sm text-gray-600">Average Score</div>
                      <div className="text-2xl font-bold text-primary-500">
                        {stats.avg_score.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                      <div className="flex justify-center mb-2 text-3xl">
                        <Target className="text-primary-500" strokeWidth={2} size={36} />
                      </div>
                      <div className="text-sm text-gray-600">Median Score</div>
                      <div className="text-2xl font-bold text-primary-500">
                        {stats.median_score.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                      <div className="flex justify-center mb-2 text-3xl">
                        <BarChart3 className="text-[#2c3e50]" strokeWidth={2} size={36} />
                      </div>
                      <div className="text-sm text-gray-600">Total Projects</div>
                      <div className="text-2xl font-bold text-[#2c3e50]">{stats.total_count}</div>
                    </div>
                    <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                      <div className="flex justify-center mb-2 text-3xl">
                        <Activity className="text-emerald-500" strokeWidth={2} size={36} />
                      </div>
                      <div className="text-sm text-gray-600">Avg Confidence</div>
                      <div className="text-2xl font-bold text-emerald-500">
                        {stats.avg_confidence ? `${stats.avg_confidence.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Derived Metrics Overview */}
                {stats &&
                  (stats.avg_technical_feasibility ||
                    stats.avg_economic_viability ||
                    stats.avg_circularity_potential) && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                        <div className="flex justify-center mb-2 text-3xl">
                          <Sparkles className="text-blue-500" strokeWidth={2} size={36} />
                        </div>
                        <div className="text-sm text-gray-600">Avg Technical Feasibility</div>
                        <div className="text-2xl font-bold text-blue-500">
                          {stats.avg_technical_feasibility
                            ? stats.avg_technical_feasibility.toFixed(1)
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                        <div className="flex justify-center mb-2 text-3xl">
                          <Briefcase className="text-green-500" strokeWidth={2} size={36} />
                        </div>
                        <div className="text-sm text-gray-600">Avg Economic Viability</div>
                        <div className="text-2xl font-bold text-green-500">
                          {stats.avg_economic_viability
                            ? stats.avg_economic_viability.toFixed(1)
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                        <div className="flex justify-center mb-2 text-3xl">
                          <Trophy className="text-purple-500" strokeWidth={2} size={36} />
                        </div>
                        <div className="text-sm text-gray-600">Avg Circularity Potential</div>
                        <div className="text-2xl font-bold text-purple-500">
                          {stats.avg_circularity_potential
                            ? stats.avg_circularity_potential.toFixed(1)
                            : 'N/A'}
                        </div>
                      </div>
                      {userScore != null && (
                        <div className="p-5 bg-linear-to-br from-[#fff9e6] to-[#fffbf0] border-2 border-accent-500 shadow-md rounded-xl">
                          <div className="flex justify-center mb-2 text-3xl">
                            <Star
                              className="text-accent-500"
                              strokeWidth={2}
                              fill="#ff9800"
                              size={36}
                            />
                          </div>
                          <div className="text-sm text-gray-600">Your Percentile</div>
                          <div className="text-2xl font-bold text-accent-500">
                            {userPercentile}th
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Performance Comparison Metrics */}
                {stats && userScore != null && marketData && marketData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-md rounded-xl">
                      <div className="text-sm text-gray-600 mb-2">Percentile Rank</div>
                      <div className="text-2xl font-bold text-blue-700">{userPercentile}%</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {userPercentile > 90
                          ? 'Exceptional performer - top 10% of market'
                          : userPercentile > 75
                            ? 'Strong performer - top 25% of market'
                            : userPercentile > 50
                              ? 'Solid performer - above average'
                              : 'Emerging - opportunity for growth'}
                      </div>
                    </div>
                    <div className="p-4 bg-linear-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-md rounded-xl">
                      <div className="text-sm text-gray-600 mb-2">Performance Advantage</div>
                      <div className="text-2xl font-bold text-green-700">
                        {benchmarkDeltaPercent != null
                          ? `${Math.abs(benchmarkDeltaPercent)}%`
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {benchmarkDeltaPercent != null
                          ? benchmarkDeltaPercent > 0
                            ? 'Above industry benchmark'
                            : 'Below industry benchmark'
                          : 'Calculating advantage...'}
                      </div>
                    </div>
                    <div className="p-4 bg-linear-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-md rounded-xl">
                      <div className="text-sm text-gray-600 mb-2">Market Position</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {userPercentile > 50 ? 'Leader' : 'Challenger'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Based on your assessment score relative to market peers
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Maturity Index */}
                {stats && marketData && (
                  <div className="p-6 bg-linear-to-r from-slate-50 to-slate-100 border-2 border-slate-200 shadow-md rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 font-semibold mb-1">
                          Market Maturity
                        </div>
                        <div className="text-lg font-bold text-slate-800">
                          {stats.avg_score > 75
                            ? 'Mature'
                            : stats.avg_score > 50
                              ? 'Developing'
                              : 'Emerging'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Weighted by average performance across all sectors
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 font-semibold mb-1">
                          Score Volatility
                        </div>
                        <div className="text-lg font-bold text-slate-800">
                          {((stats.max_score - stats.min_score) / 4).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Standard deviation of market scores (lower = stability)
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 font-semibold mb-1">Score Range</div>
                        <div className="text-lg font-bold text-slate-800">
                          {stats.min_score.toFixed(1)} - {stats.max_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Top to bottom performing assessments
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 font-semibold mb-1">
                          Active Sectors
                        </div>
                        <div className="text-lg font-bold text-slate-800">{marketData.length}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Industries tracked in this analysis
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Score by scale summary */}
                {marketData &&
                  marketData.length > 0 &&
                  (() => {
                    const byScale = {};
                    marketData.forEach((d) => {
                      const scale = d.scale || 'Unknown';
                      if (!byScale[scale])
                        byScale[scale] = { totalScore: 0, count: 0, projects: 0 };
                      byScale[scale].totalScore += (d.avg_score || 0) * (d.count || 0);
                      byScale[scale].count += d.count || 0;
                      byScale[scale].projects += 1;
                    });
                    const scaleSummary = Object.entries(byScale).map(([scale, s]) => ({
                      scale,
                      avgScore: s.count ? Number((s.totalScore / s.count).toFixed(1)) : 0,
                      count: s.count,
                      sectorCount: s.projects,
                    }));
                    if (scaleSummary.length === 0) return null;
                    return (
                      <div className="p-6 bg-white border-2 border-slate-200 shadow-md rounded-xl">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <BarChart3 className="text-slate-600" size={20} />
                          Score by company scale
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {scaleSummary
                            .sort((a, b) => b.avgScore - a.avgScore)
                            .map((s) => (
                              <div
                                key={s.scale}
                                className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                              >
                                <div className="text-sm font-semibold text-slate-700">
                                  {titleize(s.scale)}
                                </div>
                                <div className="text-xl font-bold text-primary-600">
                                  {s.avgScore.toFixed(1)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {s.count} projects · {s.sectorCount} sectors
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })()}

                {/* Sector rankings: top performers & improvement opportunities */}
                {marketData && marketData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border-2 border-emerald-200 shadow-md rounded-xl">
                      <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Trophy className="text-emerald-600" size={16} />
                        Top 5 sectors by score
                      </h3>
                      <ul className="space-y-2">
                        {[...marketData]
                          .sort((a, b) => b.avg_score - a.avg_score)
                          .slice(0, 5)
                          .map((sector, idx) => (
                            <li
                              key={sector.industry + idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium text-slate-700">
                                {titleize(sector.industry)}
                              </span>
                              <span className="font-bold text-emerald-600">
                                {sector.avg_score.toFixed(1)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="p-5 bg-white border-2 border-amber-200 shadow-md rounded-xl">
                      <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="text-amber-600" size={16} />
                        Improvement opportunities (lowest scores)
                      </h3>
                      <ul className="space-y-2">
                        {[...marketData]
                          .sort((a, b) => a.avg_score - b.avg_score)
                          .slice(0, 5)
                          .map((sector, idx) => (
                            <li
                              key={sector.industry + idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium text-slate-700">
                                {titleize(sector.industry)}
                              </span>
                              <span className="font-bold text-amber-600">
                                {sector.avg_score.toFixed(1)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
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
                        {trendData.overallVolatility != null
                          ? `${trendData.overallVolatility}`
                          : 'N/A'}
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
                          {isOutperforming ? 'Outperforming' : 'Opportunity for Growth'}
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
                        <ProgressBar
                          value={normalizedBenchmarkScore != null ? normalizedBenchmarkScore : 0}
                          color="primary"
                          aria-label={`Industry average score: ${normalizedBenchmarkScore != null ? normalizedBenchmarkScore.toFixed(1) : 'N/A'} out of 100`}
                        >
                          <ProgressBar.Track className="h-3 bg-primary-100">
                            <ProgressBar.Fill className="bg-primary-500" />
                          </ProgressBar.Track>
                        </ProgressBar>
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
                          <strong className="text-[#059669]">
                            {Math.abs(benchmarkDeltaPercent)}%
                          </strong>{' '}
                          {benchmarkDeltaPercent >= 0 ? 'higher' : 'lower'} than the industry
                          average
                          {userIndustry ? ` for ${titleize(userIndustry)}` : ''}.
                        </span>
                      )}
                      {computedIndustryBenchmark && (
                        <div className="mt-3 text-sm text-slate-700">
                          Industry benchmark for <strong>{titleize(userIndustry)}</strong>:{' '}
                          <strong className="text-primary-500">
                            {computedIndustryBenchmark.avg_score.toFixed(1)} / 100
                          </strong>{' '}
                          ({computedIndustryBenchmark.count} projects)
                        </div>
                      )}
                    </div>
                  </Card.Content>
                </Card>

                {/* Market Dynamics & Competitive Landscape */}
                {marketData && marketData.length > 0 && (
                  <Card className="border shadow-sm border-slate-200 bg-linear-to-br from-amber-50/50 to-orange-50/50">
                    <Card.Header className="pb-3">
                      <Card.Title className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                        <TrendingUp className="text-amber-600" size={20} />
                        Market Dynamics & Competitive Landscape
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <p className="font-semibold text-slate-900 text-sm mb-3">
                            Sector Performance Leaders
                          </p>
                          <div className="space-y-2">
                            {marketData
                              .sort((a, b) => b.avg_score - a.avg_score)
                              .slice(0, 3)
                              .map((sector, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">
                                      {titleize(sector.industry)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(sector.avg_score / 100) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                                      {sector.avg_score.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <p className="font-semibold text-slate-900 text-sm mb-3">
                            Sector Momentum (Projects)
                          </p>
                          <div className="space-y-2">
                            {marketData
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 3)
                              .map((sector, idx) => {
                                const maxCount = Math.max(...marketData.map((m) => m.count || 0));
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-slate-700 truncate">
                                        {titleize(sector.industry)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 rounded-full"
                                          style={{
                                            width: `${((sector.count || 0) / maxCount) * 100}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                                        {sector.count}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-slate-900 text-sm mb-3">
                          Market Concentration Analysis
                        </p>
                        <div className="space-y-2 text-xs text-slate-600">
                          <p>
                            <strong>Concentration Index:</strong>{' '}
                            {stats && marketData.length > 0
                              ? (
                                  marketData
                                    .map((d) => d.count || 0)
                                    .reduce((sum, c) => sum + (c / stats.total_count) ** 2, 0) * 100
                                ).toFixed(1) + '%'
                              : 'N/A'}
                          </p>
                          <p className="text-slate-500">
                            Shows how concentrated the market is across sectors. Higher = more
                            concentrated in fewer sectors.
                          </p>
                          <p className="mt-2">
                            <strong>Market Spread:</strong> {marketData.length} active sectors with
                            diverse performance profiles, indicating a maturing and competitive
                            landscape.
                          </p>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                )}

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
                  <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)] min-w-0 overflow-hidden">
                    <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                      <BarChart3 className="text-[#4a90e2]" strokeWidth={2.5} size={24} /> Top
                      Industries by Average Score
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
                  <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)] min-w-0 overflow-hidden">
                    <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                      <Target className="text-[#4a90e2]" strokeWidth={2.5} size={24} /> Score
                      Distribution by Industry
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
                  <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)] overflow-x-auto min-w-0">
                    <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                      <Trophy className="text-accent-500" strokeWidth={2.5} size={24} /> Industry
                      Benchmarks
                    </h2>

                    {/* Strategy Breakdown Chart */}
                    {strategyChartData.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">
                          Strategy Breakdown
                        </h3>
                        <div className="w-full h-56">
                          <BarChart
                            data={strategyChartData}
                            barConfigs={[
                              { dataKey: 'avgScore', fill: '#1f78b4', name: 'Avg Score' },
                            ]}
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
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">
                          Industry Trend
                        </h3>
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
                          <th
                            className="px-2 md:px-3 py-2 md:py-3 pl-4 text-left border-b border-gray-300 font-bold text-[#2c3e50]"
                            aria-label="Industry column header"
                          >
                            Industry
                          </th>
                          <th
                            className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]"
                            aria-label="Scale column header"
                          >
                            Scale
                          </th>
                          <th
                            className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]"
                            aria-label="Projects column header"
                          >
                            Projects
                          </th>
                          <th
                            className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]"
                            aria-label="Average Score column header"
                          >
                            Avg Score
                          </th>
                          <th
                            className="px-2 md:px-3 py-2 md:py-3 pr-4 text-left border-b border-gray-300 font-bold text-[#2c3e50]"
                            aria-label="Range column header"
                          >
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
                                  <ArrowRight className="text-gray-600" strokeWidth={2} size={12} />{' '}
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
                    <Lightbulb className="text-[#ff6f00]" strokeWidth={2.5} size={24} /> Key Market
                    Insights
                  </h2>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
                    <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                      <div className="flex mb-3 text-2xl">
                        <Target className="text-accent-500" strokeWidth={2} size={28} />
                      </div>
                      <div className="text-base font-bold text-[#2c3e50] mb-2">
                        Sectoral Performance
                      </div>
                      <div className="text-[0.85rem] text-gray-700 leading-6">
                        {marketData && marketData.length > 0
                          ? `${marketData.length} active industries tracked with an average score of ${(marketData.reduce((sum, item) => sum + item.avg_score, 0) / marketData.length).toFixed(1)}. Score range ${Math.min(...marketData.map((m) => m.avg_score)).toFixed(1)}–${Math.max(...marketData.map((m) => m.avg_score)).toFixed(1)}.`
                          : 'Loading industry performance data...'}
                      </div>
                    </div>
                    <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                      <div className="flex mb-3 text-2xl">
                        <TrendingUp className="text-accent-500" strokeWidth={2} size={28} />
                      </div>
                      <div className="text-base font-bold text-[#2c3e50] mb-2">
                        Growth Opportunity
                      </div>
                      <div className="text-[0.85rem] text-gray-700 leading-6">
                        {marketData && marketData.length > 0
                          ? `Highest-scoring sector: ${titleize([...marketData].sort((a, b) => b.avg_score - a.avg_score)[0]?.industry || 'N/A')} (${[...marketData].sort((a, b) => b.avg_score - a.avg_score)[0]?.avg_score.toFixed(1) ?? '—'}/100). Significant room for innovation in lower-scoring sectors.`
                          : "Emerging industries show varied scores—there's significant room for specialized innovation and differentiation"}
                      </div>
                    </div>
                    <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                      <div className="flex mb-3 text-2xl">
                        <Briefcase className="text-accent-500" strokeWidth={2} size={28} />
                      </div>
                      <div className="text-base font-bold text-[#2c3e50] mb-2">Scale Factor</div>
                      <div className="text-[0.85rem] text-gray-700 leading-6">
                        {stats
                          ? `${stats.total_count} projects analyzed across ${getScales().length > 1 ? getScales().length - 1 : 1} scale categories. Median market score: ${stats.median_score?.toFixed(1) ?? '—'}.`
                          : 'Analyzing scale distribution...'}
                      </div>
                    </div>
                    <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                      <div className="flex mb-3 text-2xl">
                        <Star
                          className="text-accent-500"
                          strokeWidth={2}
                          fill="#ff9800"
                          size={28}
                        />
                      </div>
                      <div className="text-base font-bold text-[#2c3e50] mb-2">
                        Your Competitive Edge
                      </div>
                      <div className="text-[0.85rem] text-gray-700 leading-6">
                        {userScore != null
                          ? `You score in the ${userPercentile}th percentile — ${userPercentile > 75 ? 'exceptional leader' : userPercentile > 50 ? 'strong performer' : 'emerging player'} in your market${benchmarkDeltaPercent != null ? ` (${benchmarkDeltaPercent >= 0 ? '+' : ''}${benchmarkDeltaPercent}% vs sector).` : '.'}`
                          : 'Assess your performance to benchmark'}
                      </div>
                    </div>
                    {stats && (
                      <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-accent-500 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                        <div className="flex mb-3 text-2xl">
                          <Info className="text-accent-500" strokeWidth={2} size={28} />
                        </div>
                        <div className="text-base font-bold text-[#2c3e50] mb-2">Score spread</div>
                        <div className="text-[0.85rem] text-gray-700 leading-6">
                          Market scores span {stats.min_score?.toFixed(1) ?? '—'} to{' '}
                          {stats.max_score?.toFixed(1) ?? '—'}. Volatility (std dev){' '}
                          {((stats.max_score - stats.min_score) / 4).toFixed(1)} —{' '}
                          {stats.avg_score > 70
                            ? 'relatively stable'
                            : stats.avg_score > 50
                              ? 'moderate variation'
                              : 'high variation'}{' '}
                          across sectors.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Competitive Positioning Analysis */}
                <Card className="border shadow-sm border-slate-200 bg-linear-to-br from-slate-50 to-slate-100">
                  <Card.Header className="pb-3">
                    <Card.Title className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                      <Trophy className="text-amber-500" size={20} />
                      Competitive Positioning Analysis
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-slate-900 mb-2">Market Concentration</p>
                        <p className="text-slate-600 text-xs leading-5">
                          {stats && stats.total_count > 0
                            ? `The market has ${marketData.length} active sectors with ${Math.round((marketData.filter((d) => d.count > stats.total_count / marketData.length).length / marketData.length) * 100)}% of focus concentrated in top performers.`
                            : 'Calculating market distribution...'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-slate-900 mb-2">Innovation Frontier</p>
                        <p className="text-slate-600 text-xs leading-5">
                          {marketData && marketData.length > 0
                            ? (() => {
                                const byScore = [...marketData].sort(
                                  (a, b) => b.avg_score - a.avg_score,
                                );
                                const top = byScore[0];
                                return `Highest performing sector: ${titleize(top?.industry || 'N/A')} (${top?.avg_score?.toFixed(1) || '—'}/100)`;
                              })()
                            : 'Loading innovation data...'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-slate-900 mb-2">Your Market Position</p>
                        <p className="text-slate-600 text-xs leading-5">
                          {isOutperforming ? (
                            <span className="text-emerald-600 font-medium">
                              Leading position in{' '}
                              {userIndustry ? titleize(userIndustry) : 'your sector'} with{' '}
                              {benchmarkDeltaPercent}% above average performance.
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              Growth opportunity: {Math.abs(benchmarkDeltaPercent)}% below sector
                              average. Focus on {specificArea} to close the gap.
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-slate-900 mb-2">Sector Maturity</p>
                        <p className="text-slate-600 text-xs leading-5">
                          {stats
                            ? `Market maturity score: ${stats.avg_score.toFixed(1)}/100 with ${stats.total_count} verified assessments. Standard deviation: ${((stats.max_score - stats.min_score) / 4).toFixed(1)}.`
                            : 'Calculating sector maturity...'}
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                {/* Strategic Recommendations */}
                <Card className="border shadow-sm border-slate-200 bg-blue-50/50">
                  <Card.Header className="pb-3">
                    <Card.Title className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                      <Sparkles className="text-blue-500" size={20} />
                      Personalized Strategic Pathways
                    </Card.Title>
                    <Card.Description className="text-sm text-slate-600">
                      Data-driven recommendations based on your assessment and market trends
                    </Card.Description>
                  </Card.Header>
                  <Card.Content className="space-y-3">
                    {isOutperforming ? (
                      <div className="space-y-3">
                        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
                          <p className="font-semibold text-emerald-900 text-sm mb-1">
                            Maintain Leadership
                          </p>
                          <p className="text-sm text-emerald-700">
                            Your circular strategy is outperforming the market. Focus on scaling
                            your {primaryPillar} to capture greater market share and establish
                            thought leadership.
                          </p>
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <p className="font-semibold text-blue-900 text-sm mb-1">
                            Differentiation Angle
                          </p>
                          <p className="text-sm text-blue-700">
                            Leverage your superior performance to build premium positioning, attract
                            higher-value partnerships, and influence industry standards.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                          <p className="font-semibold text-amber-900 text-sm mb-1">Close the Gap</p>
                          <p className="text-sm text-amber-700">
                            You&apos;re {Math.abs(benchmarkDeltaPercent)}% below the sector average.
                            Prioritize improvements in {specificArea} to enhance competitiveness and
                            market positioning.
                          </p>
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <p className="font-semibold text-blue-900 text-sm mb-1">Quick Wins</p>
                          <p className="text-sm text-blue-700">
                            Identify high-impact, low-resource initiatives in your gaps. Learn from
                            top performers in {titleize(marketData[0]?.industry || 'your sector')}{' '}
                            to accelerate improvement.
                          </p>
                        </div>
                      </div>
                    )}
                  </Card.Content>
                </Card>

                {/* AI Strategic Insight */}
                <Card className="border shadow-sm border-slate-200 bg-sky-50/70">
                  <Card.Header className="pb-2">
                    <Card.Title className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                      <Sparkles className="text-sky-500" size={20} />
                      Strategic Recommendation
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="text-sm leading-6 text-slate-700">
                    {isOutperforming ? (
                      <span>
                        Your circular strategy is leading the {industryLabel} sector. To maintain
                        this advantage, focus on scaling your <strong>{primaryPillar}</strong> to
                        increase market share.
                      </span>
                    ) : (
                      <span>
                        You are currently trailing the industry average for {industryLabel}.
                        Prioritizing <strong>{specificArea}</strong> could bridge the gap and
                        improve your competitive standing.
                      </span>
                    )}
                  </Card.Content>
                </Card>

                {/* Data coverage & methodology */}
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-600">
                  <p className="font-semibold text-slate-700 mb-2">Data coverage & methodology</p>
                  <p className="leading-relaxed">
                    Benchmarks are derived from public, consenting assessments only. Metrics include
                    average and median scores, viability, and counts by industry and scale. Time
                    range and granularity (weekly/monthly/daily) affect trend series. Percentiles
                    and sector rankings are computed from the current filtered dataset. Export CSV
                    includes raw industry-scale-score data for your own analysis.
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 text-sm text-center text-gray-500">
                  Last updated:&nbsp;
                  {getCurrentTimestampFormatted()}
                </div>
              </div>
            </Tab>

            <Tab key="dataset-insights" title="Dataset Insights">
              <div className="space-y-6 mt-6">
                {/* Dataset Overview Header */}
                <div className="p-6 bg-linear-to-r from-secondary-500 to-secondary-600 rounded-2xl text-white shadow-lg">
                  <h1 className="flex items-center gap-2 text-3xl font-bold">
                    <BarChart3 className="text-white" strokeWidth={2.5} size={32} /> Dataset
                    Insights
                  </h1>
                  <p className="mt-2 text-lg opacity-90">
                    Explore the distribution and composition of the circular economy dataset
                  </p>
                </div>

                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <ProgressCircle aria-label="Loading..." />
                  </div>
                ) : statsError ? (
                  <Alert severity="error">{statsError}</Alert>
                ) : documentStats ? (
                  <>
                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Industry Distribution</h3>
                        <BarChart
                          data={documentStats.byIndustry || []}
                          barConfigs={[{ dataKey: 'count', name: 'Count', fill: '#2563eb' }]}
                          height={300}
                          xAxisKey="value"
                          xAxisLabel="Industry"
                          yAxisLabel="Number of Cases"
                          showLegend={false}
                        />
                      </Card>
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">R-Strategy Distribution</h3>
                        <PieChart
                          data={documentStats.byRStrategy || []}
                          dataKey="count"
                          nameKey="value"
                          height={300}
                          showLegend={true}
                        />
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                        <BarChart
                          data={documentStats.byCategory || []}
                          barConfigs={[{ dataKey: 'count', name: 'Count', fill: '#059669' }]}
                          height={300}
                          xAxisKey="value"
                          xAxisLabel="Category"
                          yAxisLabel="Number of Cases"
                          showLegend={false}
                        />
                      </Card>
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Scale Distribution</h3>
                        <BarChart
                          data={documentStats.byScale || []}
                          barConfigs={[{ dataKey: 'count', name: 'Count', fill: '#f97316' }]}
                          height={300}
                          xAxisKey="value"
                          xAxisLabel="Scale"
                          yAxisLabel="Number of Cases"
                          showLegend={false}
                        />
                      </Card>
                    </div>

                    {/* Top Sources Table */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Top 10 Sources by Case Count</h3>
                      <Table>
                        <Table.ScrollContainer>
                          <Table.Content aria-label="Top Sources" className="min-w-full">
                            <Table.Header>
                              <Table.Column>Source</Table.Column>
                              <Table.Column className="text-right">Count</Table.Column>
                            </Table.Header>
                            <Table.Body>
                              {(documentStats.bySource || []).slice(0, 10).map((source) => (
                                <Table.Row key={source.value}>
                                  <Table.Cell>{source.value}</Table.Cell>
                                  <Table.Cell className="text-right">{source.count}</Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Content>
                        </Table.ScrollContainer>
                      </Table>
                    </Card>
                  </>
                ) : (
                  <Alert severity="info">No dataset statistics available.</Alert>
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
      )}
    </div>
  );
}
