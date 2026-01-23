import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import '../styles/MarketAnalysisView.css';

export default function MarketAnalysisView({ currentAssessmentScore, currentIndustry, onBack }) {
  const [marketData, setMarketData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterScale, setFilterScale] = useState('all');
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/analytics/market`);
      const data = await response.json();
      setMarketData(data.market_data || []);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to load market data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const titleize = (txt) =>
    txt
      ? String(txt)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : 'N/A';

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

  // Group by industry for trend
  const industryTrends = {};
  marketData.forEach((item) => {
    if (!industryTrends[item.industry]) {
      industryTrends[item.industry] = [];
    }
    industryTrends[item.industry].push({
      scale: item.scale || 'Medium',
      avg_score: item.avg_score || 0,
      count: item.count,
    });
  });

  const getScales = () => {
    const scales = new Set(marketData.map((d) => d.scale).filter(Boolean));
    return ['all', ...Array.from(scales)];
  };

  const userPercentile = stats
    ? Math.round(
        (((currentAssessmentScore || 0) - (stats.min_score || 0)) /
          ((stats.max_score || 100) - (stats.min_score || 0))) *
          100,
      )
    : 0;

  if (loading)
    return (
      <div className="app-container">
        <p>Loading market data...</p>
      </div>
    );
  if (error)
    return (
      <div className="app-container">
        <p className="error">{error}</p>
      </div>
    );

  return (
    <div className="app-container">
      <div className="market-analysis-view">
        {/* Header */}
        <div className="header-section">
          <div className="logo-icon">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#34a83a" strokeWidth="3" fill="none" />
              <path
                d="M20 40 L32 20 L44 35"
                stroke="#34a83a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="main-title">Market Analysis Dashboard</h1>
          <p className="subtitle">Competitive positioning & industry benchmarks</p>
        </div>

        {/* User Position Card */}
        {currentAssessmentScore && (
          <div className="position-card">
            <h2>Your Position in Market</h2>
            <div className="position-grid">
              <div className="position-stat">
                <div className="stat-label">Your Score</div>
                <div className="stat-value" style={{ color: '#34a83a', fontSize: '2rem' }}>
                  {currentAssessmentScore}/100
                </div>
              </div>
              <div className="position-stat">
                <div className="stat-label">Industry</div>
                <div className="stat-value">{titleize(currentIndustry || 'General')}</div>
              </div>
              <div className="position-stat">
                <div className="stat-label">vs. All Projects</div>
                <div className="stat-value" style={{ color: '#4a90e2' }}>
                  {userPercentile}th Percentile
                </div>
              </div>
              <div className="position-stat">
                <div className="stat-label">Market Average</div>
                <div className="stat-value" style={{ color: '#ff9800' }}>
                  {Math.round(stats?.avg_score || 0)}/100
                </div>
              </div>
            </div>

            {/* Positioning Insight */}
            <div className="positioning-insight">
              {currentAssessmentScore > (stats?.avg_score || 0) ? (
                <p>
                  ✓ <strong>Above average:</strong> Your assessment scores higher than the typical
                  circular economy project in the database.
                </p>
              ) : (
                <p>
                  → <strong>At or below average:</strong> There's opportunity to improve. Review
                  recommendations to strengthen your proposal.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Market Statistics */}
        {stats && (
          <div className="stats-card">
            <h2>Market Overview (All Assessments)</h2>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-number">{stats.total_assessments}</div>
                <div className="stat-name">Total Assessments</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{Math.round(stats.avg_score)}/100</div>
                <div className="stat-name">Average Score</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{Math.round(stats.median_score)}/100</div>
                <div className="stat-name">Median Score</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{stats.max_score}/100</div>
                <div className="stat-name">Top Score</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{stats.min_score}/100</div>
                <div className="stat-name">Lowest Score</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{stats.total_industries}</div>
                <div className="stat-name">Industries Tracked</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="analysis-controls">
          <label>Filter by Scale:</label>
          <select value={filterScale} onChange={(e) => setFilterScale(e.target.value)}>
            {getScales().map((scale) => (
              <option key={scale} value={scale}>
                {scale === 'all' ? 'All Scales' : titleize(scale)}
              </option>
            ))}
          </select>
        </div>

        {/* Scatter Plot */}
        {scatterChartData.length > 0 && (
          <div className="chart-card">
            <h2>Score Distribution by Industry</h2>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  name="Average Score"
                  label={{ value: 'Average Score', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis
                  dataKey="y"
                  name="Project Index"
                  label={{ value: 'Industry/Scale Segment', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="tooltip-box">
                          <p>
                            <strong>{titleize(data.industry)}</strong> ({data.scale})
                          </p>
                          <p>Avg: {data.x.toFixed(1)}/100</p>
                          <p>Projects: {data.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Projects" data={scatterChartData} fill="#34a83a" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {[...new Set(scatterChartData.map((d) => d.industry))].map((industry) => (
                <div key={industry} className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: getIndustryColor(industry) }}
                  />
                  <span>{titleize(industry)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Industry Benchmarks Table */}
        {marketData.length > 0 && (
          <div className="benchmarks-card">
            <h2>Industry Benchmarks</h2>
            <table className="benchmarks-table">
              <thead>
                <tr>
                  <th>Industry</th>
                  <th>Scale</th>
                  <th>Projects</th>
                  <th>Avg Score</th>
                  <th>Range</th>
                </tr>
              </thead>
              <tbody>
                {marketData
                  .filter((item) => filterScale === 'all' || item.scale === filterScale)
                  .sort((a, b) => b.avg_score - a.avg_score)
                  .map((item, idx) => (
                    <tr key={idx}>
                      <td className="industry-name">
                        <strong>{titleize(item.industry)}</strong>
                      </td>
                      <td>{titleize(item.scale)}</td>
                      <td className="count">{item.count}</td>
                      <td className="score">
                        <strong style={{ color: '#34a83a' }}>
                          {item.avg_score.toFixed(1)}/100
                        </strong>
                      </td>
                      <td className="range">
                        {item.min_score} - {item.max_score}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Insights */}
        <div className="insights-card">
          <h2>Market Insights</h2>
          <ul>
            <li>
              <strong>Top Performers:</strong> Projects in <strong>Energy</strong> and{' '}
              <strong>Water</strong> industries tend to score highest
            </li>
            <li>
              <strong>Growth Areas:</strong> Emerging industries show varied scores—opportunity for
              specialized innovation
            </li>
            <li>
              <strong>Scale Factor:</strong> Larger, commercial-stage projects generally score
              higher than prototypes
            </li>
            <li>
              <strong>Your Advantage:</strong> Focus on your unique circular strategy to
              differentiate in your market segment
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="market-footer">
          <button className="back-button" onClick={onBack}>
            ← Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
