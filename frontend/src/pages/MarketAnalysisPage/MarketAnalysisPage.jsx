import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppContainer from '@/components/layout/AppContainer';
import Loader from '@/components/common/Loader';
import BarChart from '@/components/charts/BarChart';
import ScatterChart from '@/components/charts/ScatterChart';
import { titleize } from '@/lib/formatting';
import { getCurrentTimestampFormatted } from '@/lib/formatting';
import { useMarketAnalysis } from '@/features/assessments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';

export default function MarketAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filterScale, setFilterScale] = useState('all');

  // Fetch market analysis data using hook
  const { marketData, stats, userScore, userIndustry, isLoading, isError, error, refetch } =
    useMarketAnalysis({
      assessmentId: id,
      enabled: true,
    });

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

  const userPercentile = stats
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

  return (
    <AppContainer>
      <div className="w-full max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToResults}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Results
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader />
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
          <div className="space-y-6">
            {/* Header Section */}
            <div className="p-6 bg-gradient-to-r from-[#34a83a] to-[#2d8f32] rounded-2xl text-white shadow-lg">
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
                    <TrendingUp className="w-9 h-9 text-[#34a83a]" strokeWidth={2} />
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                  <div className="text-2xl font-bold text-[#34a83a]">
                    {stats.avg_score.toFixed(1)}
                  </div>
                </div>
                <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                  <div className="flex justify-center mb-2 text-3xl">
                    <Target className="w-9 h-9 text-[#34a83a]" strokeWidth={2} />
                  </div>
                  <div className="text-sm text-gray-600">Median Score</div>
                  <div className="text-2xl font-bold text-[#34a83a]">
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
                  <div className="p-5 bg-gradient-to-br from-[#fff9e6] to-[#fffbf0] border-2 border-[#ff9800] shadow-md rounded-xl">
                    <div className="flex justify-center mb-2 text-3xl">
                      <Star className="w-9 h-9 text-[#ff6f00]" strokeWidth={2} fill="#ff9800" />
                    </div>
                    <div className="text-sm text-gray-600">Your Percentile</div>
                    <div className="text-2xl font-bold text-[#ff6f00]">{userPercentile}th</div>
                  </div>
                )}
              </div>
            )}

            {/* Industry Benchmarking */}
            <Card className="border shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-xl font-semibold text-[#1f2937]">
                    Industry Benchmarking
                  </CardTitle>
                  {normalizedUserScore != null && normalizedBenchmarkScore != null && (
                    <Badge
                      className={
                        isOutperforming
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      }
                    >
                      {isOutperforming ? 'Outperforming' : 'Opportunity for Growth'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      className="h-3 bg-slate-200"
                      indicatorClassName="bg-slate-400"
                    />
                    {userIndicatorPosition != null && (
                      <div
                        className="absolute top-[-6px] h-6 w-0.5 bg-[#059669]"
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
                </div>
              </CardContent>
            </Card>

            {/* Filter Controls */}
            {getScales().length > 1 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Filter by Scale:</span>
                {getScales().map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setFilterScale(scale)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterScale === scale
                        ? 'bg-[#34a83a] text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {titleize(scale)}
                  </button>
                ))}
              </div>
            )}

            {/* Bar Chart Section - Top Industries */}
            {barChartData.length > 0 && (
              <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[#4a90e2]" strokeWidth={2.5} /> Top Industries
                  by Average Score
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
                      <div className="bg-white/[0.98] p-3 px-4 border border-gray-300 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
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
                  <Trophy className="w-6 h-6 text-[#ff9800]" strokeWidth={2.5} /> Industry
                  Benchmarks
                </h2>
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
                            <span className="inline-block bg-[#f0f7f0] px-3 py-1 rounded font-bold text-[#34a83a]">
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
            <div className="bg-gradient-to-br from-[#fff9e6] to-[#fffbf0] py-7 px-7 rounded-[10px] border-2 border-[#ff9800] shadow-[0_8px_24px_rgba(255,152,0,0.1)]">
              <h2 className="text-[#ff6f00] text-2xl font-bold mt-0 mb-6 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-[#ff6f00]" strokeWidth={2.5} /> Key Market
                Insights
              </h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
                <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="flex mb-3 text-2xl">
                    <Target className="w-7 h-7 text-[#ff9800]" strokeWidth={2} />
                  </div>
                  <div className="text-base font-bold text-[#2c3e50] mb-2">Top Performers</div>
                  <div className="text-[0.85rem] text-gray-700 leading-6">
                    Projects in <strong>Energy</strong> and <strong>Water</strong> industries tend
                    to score highest on circular economy metrics
                  </div>
                </div>
                <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="flex mb-3 text-2xl">
                    <TrendingUp className="w-7 h-7 text-[#ff9800]" strokeWidth={2} />
                  </div>
                  <div className="text-base font-bold text-[#2c3e50] mb-2">Growth Opportunity</div>
                  <div className="text-[0.85rem] text-gray-700 leading-6">
                    Emerging industries show varied scores—there&apos;s significant room for
                    specialized innovation and differentiation
                  </div>
                </div>
                <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="flex mb-3 text-2xl">
                    <Briefcase className="w-7 h-7 text-[#ff9800]" strokeWidth={2} />
                  </div>
                  <div className="text-base font-bold text-[#2c3e50] mb-2">Scale Factor</div>
                  <div className="text-[0.85rem] text-gray-700 leading-6">
                    Larger, commercial-stage projects generally score higher than prototypes and
                    early-stage initiatives
                  </div>
                </div>
                <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <div className="flex mb-3 text-2xl">
                    <Star className="w-7 h-7 text-[#ff9800]" strokeWidth={2} fill="#ff9800" />
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
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                  <Sparkles className="w-5 h-5 text-sky-500" />
                  Strategic Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-slate-700">
                {isOutperforming ? (
                  <span>
                    Your circular strategy is leading the {industryLabel} sector. To maintain this
                    advantage, focus on scaling your <strong>{primaryPillar}</strong> to increase
                    market share.
                  </span>
                ) : (
                  <span>
                    You are currently trailing the industry average for {industryLabel}.
                    Prioritizing <strong>{specificArea}</strong> could bridge the gap and improve
                    your competitive standing.
                  </span>
                )}
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-6 text-sm text-center text-gray-500">
              Last updated:&nbsp;
              {getCurrentTimestampFormatted()}
            </div>
          </div>
        )}
      </div>
    </AppContainer>
  );
}
