import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import Loader from '@/components/common/Loader';
import BarChart from '@/components/charts/BarChart';
import ScatterChart from '@/components/charts/ScatterChart';
import { titleize } from '@/lib/formatting';
import { getCurrentTimestampFormatted } from '../../../lib/formatting';
import { getAssessmentById, getMarketAnalysis } from '@/features/assessments/api/assessmentApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

export default function MarketAnalysisModal({
  isOpen,
  onClose,
  currentAssessmentScore,
  currentIndustry,
}) {
  const { id } = useParams();
  const [marketData, setMarketData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterScale, setFilterScale] = useState('all');
  const [userScore, setUserScore] = useState(currentAssessmentScore || null);
  const [userIndustry, setUserIndustry] = useState(currentIndustry || null);

  useEffect(() => {
    if (isOpen) {
      fetchMarketAnalysis();
    }
  }, [isOpen]);

  useEffect(() => {
    const maybeFetchAssessment = async () => {
      if ((userScore == null || userIndustry == null) && id) {
        try {
          const payload = await getAssessmentById(id);
          const assessment = payload?.assessment?.result_json || payload?.assessment;
          if (assessment) {
            setUserScore(assessment?.overall_score || null);
            setUserIndustry(assessment?.metadata?.industry || null);
          }
        } catch (e) {
          console.error('Failed to fetch assessment data for market analysis', e);
        }
      }
    };
    if (isOpen) {
      maybeFetchAssessment();
    }
  }, [id, isOpen]);

  const fetchMarketAnalysis = async () => {
    setLoading(true);
    try {
      const data = await getMarketAnalysis();
      setMarketData(data.market_data || []);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to load market data', err.message || '');
    } finally {
      setLoading(false);
    }
  };

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

  // Prepare data for scatter plot
  const scatterChartData = marketData
    .filter((item) => filterScale === 'all' || item.scale === filterScale)
    .map((item, idx) => ({
      x: item.avg_score || 0,
      y: idx,
      industry: item.industry || 'General',
      scale: item.scale || 'Medium',
      count: item.count,
      fill: getIndustryColor(item.industry),
    }));

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

  // Prepare data for BarChart component
  const barChartData = marketData
    .filter((item) => filterScale === 'all' || item.scale === filterScale)
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, 10)
    .map((item) => ({
      name: titleize(item.industry),
      avgScore: item.avg_score,
      count: item.count,
    }));

  const barConfigs = [
    {
      dataKey: 'avgScore',
      fill: '#34a83a',
      name: 'Average Score',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogClose className="absolute top-4 right-4">✖️</DialogClose>
      <DialogContent className="w-full max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#2c3e50]">
            📊 Market Analysis
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Benchmark your circular economy initiative against the broader market
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={fetchMarketAnalysis}
                className="px-4 py-2 mt-4 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="p-6 bg-gradient-to-r from-[#34a83a] to-[#2d8f32] rounded-2xl text-white shadow-lg">
                <h1 className="text-3xl font-bold">📊 Market Landscape</h1>
                <p className="mt-2 text-lg opacity-90">
                  Benchmark your circular economy initiative against the broader market
                </p>
              </div>

              {/* Stats Overview */}
              {stats && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                    <div className="mb-2 text-3xl">📈</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                    <div className="text-2xl font-bold text-[#34a83a]">
                      {stats.avg_score.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                    <div className="mb-2 text-3xl">🎯</div>
                    <div className="text-sm text-gray-600">Median Score</div>
                    <div className="text-2xl font-bold text-[#34a83a]">
                      {stats.median_score.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-5 bg-white border-2 border-gray-200 shadow-md rounded-xl">
                    <div className="mb-2 text-3xl">📊</div>
                    <div className="text-sm text-gray-600">Total Projects</div>
                    <div className="text-2xl font-bold text-[#2c3e50]">{stats.total_count}</div>
                  </div>
                  {userScore != null && (
                    <div className="p-5 bg-gradient-to-br from-[#fff9e6] to-[#fffbf0] border-2 border-[#ff9800] shadow-md rounded-xl">
                      <div className="mb-2 text-3xl">⭐</div>
                      <div className="text-sm text-gray-600">Your Percentile</div>
                      <div className="text-2xl font-bold text-[#ff6f00]">{userPercentile}th</div>
                    </div>
                  )}
                </div>
              )}

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
                  <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6">
                    📊 Top Industries by Average Score
                  </h2>
                  <BarChart
                    data={barChartData}
                    barConfigs={barConfigs}
                    height={400}
                    showLegend={false}
                    showGrid={true}
                    yAxisDomain={[0, 100]}
                    yAxisLabel="Average Score"
                  />
                </div>
              )}

              {/* Score Distribution Scatter Plot */}
              {scatterChartData.length > 0 && (
                <div className="bg-white py-7 px-7 rounded-[10px] border border-gray-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                  <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6">
                    🎯 Score Distribution by Industry
                  </h2>
                  <ScatterChart
                    data={scatterChartData}
                    height={400}
                    xAxisLabel="Average Score"
                    xDomain={[0, 100]}
                    yDomain={[0, scatterChartData.length]}
                    showGrid={true}
                    customTooltip={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            padding: '12px 16px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        >
                          <p
                            style={{
                              margin: '0 0 8px 0',
                              fontWeight: '600',
                              fontSize: '13px',
                              color: '#1e293b',
                              textTransform: 'capitalize',
                            }}
                          >
                            {titleize(data.industry)}
                          </p>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>
                            <strong>Score:</strong> {data.x.toFixed(1)} / 100
                          </p>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>
                            <strong>Scale:</strong> {titleize(data.scale)}
                          </p>
                          <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>
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
                  <h2 className="text-[#2c3e50] text-2xl font-bold mt-0 mb-6">
                    🏆 Industry Benchmarks
                  </h2>
                  <table className="w-full border-collapse text-[0.85rem] md:text-[0.95rem]">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th
                          className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]"
                          style={{ paddingLeft: '1rem' }}
                        >
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
                        <th
                          className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-bold text-[#2c3e50]"
                          style={{ paddingRight: '1rem' }}
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
                            <td
                              className="px-2 md:px-3 py-2 md:py-3 text-left border-b border-gray-300 font-semibold text-[#2c3e50]"
                              style={{ paddingLeft: '1rem' }}
                            >
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                }}
                              >
                                <div
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
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
                              <span
                                style={{
                                  display: 'inline-block',
                                  backgroundColor: '#f0f7f0',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '4px',
                                  fontWeight: '700',
                                  color: '#34a83a',
                                }}
                              >
                                {item.avg_score.toFixed(1)} / 100
                              </span>
                            </td>
                            <td
                              className="px-2 py-2 text-sm text-center text-gray-600 border-b border-gray-300 md:px-3 md:py-3"
                              style={{ paddingRight: '1rem' }}
                            >
                              {item.min_score} → {item.max_score}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Key Insights */}
              <div className="bg-gradient-to-br from-[#fff9e6] to-[#fffbf0] py-7 px-7 rounded-[10px] border-2 border-[#ff9800] shadow-[0_8px_24px_rgba(255,152,0,0.1)]">
                <h2 className="text-[#ff6f00] text-2xl font-bold mt-0 mb-6">
                  💡 Key Market Insights
                </h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
                  <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <div className="mb-3 text-2xl">🎯</div>
                    <div className="text-base font-bold text-[#2c3e50] mb-2">Top Performers</div>
                    <div className="text-[0.85rem] text-gray-700 leading-6">
                      Projects in <strong>Energy</strong> and <strong>Water</strong> industries tend
                      to score highest on circular economy metrics
                    </div>
                  </div>
                  <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <div className="mb-3 text-2xl">📈</div>
                    <div className="text-base font-bold text-[#2c3e50] mb-2">
                      Growth Opportunity
                    </div>
                    <div className="text-[0.85rem] text-gray-700 leading-6">
                      Emerging industries show varied scores—there&apos;s significant room for
                      specialized innovation and differentiation
                    </div>
                  </div>
                  <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <div className="mb-3 text-2xl">💼</div>
                    <div className="text-base font-bold text-[#2c3e50] mb-2">Scale Factor</div>
                    <div className="text-[0.85rem] text-gray-700 leading-6">
                      Larger, commercial-stage projects generally score higher than prototypes and
                      early-stage initiatives
                    </div>
                  </div>
                  <div className="bg-white py-6 px-6 rounded-lg border-l-4 border-[#ff9800] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <div className="mb-3 text-2xl">⭐</div>
                    <div className="text-base font-bold text-[#2c3e50] mb-2">Your Advantage</div>
                    <div className="text-[0.85rem] text-gray-700 leading-6">
                      Focus on your unique circular strategy and value proposition to differentiate
                      in your market segment
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-sm text-center text-gray-500">
                Last updated:&nbsp;
                {getCurrentTimestampFormatted()}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

MarketAnalysisModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentAssessmentScore: PropTypes.number,
  currentIndustry: PropTypes.string,
};

MarketAnalysisModal.defaultProps = {
  currentAssessmentScore: null,
  currentIndustry: null,
};
