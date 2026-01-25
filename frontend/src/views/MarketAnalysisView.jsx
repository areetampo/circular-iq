import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const { id } = useParams();
  const [marketData, setMarketData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterScale, setFilterScale] = useState('all');
  const [userScore, setUserScore] = useState(currentAssessmentScore || null);
  const [userIndustry, setUserIndustry] = useState(currentIndustry || null);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchMarketData();
  }, []);

  useEffect(() => {
    const maybeFetchAssessment = async () => {
      if ((userScore == null || userIndustry == null) && id) {
        try {
          const response = await fetch(`${apiBase}/assessments/${id}`);
          const payload = await response.json();
          const assessment = payload?.assessment?.result_json || payload?.assessment;
          if (assessment) {
            setUserScore(assessment?.overall_score || null);
            setUserIndustry(assessment?.metadata?.industry || null);
          }
        } catch (e) {
          // ignore
        }
      }
    };
    maybeFetchAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        (((userScore || 0) - (stats.min_score || 0)) /
          ((stats.max_score || 100) - (stats.min_score || 0))) *
          100,
      )
    : 0;

  // Calculate additional insights
  const generateMarketInsights = () => {
    if (!stats || !marketData.length) return [];

    const insights = [];

    // If current score exists
    if (userScore != null) {
      const avgScore = stats.avg_score || 0;
      const median = stats.median_score || 0;

      if (userScore > avgScore + 10) {
        insights.push({
          icon: '🏆',
          title: 'Top Performer',
          description: `Your score (${userScore}) is significantly above average (${Math.round(avgScore)})`,
        });
      } else if (userScore > avgScore) {
        insights.push({
          icon: '📈',
          title: 'Above Market',
          description: `Your score exceeds the market average by ${userScore - Math.round(avgScore)} points`,
        });
      } else if (userScore < avgScore - 10) {
        insights.push({
          icon: '🎯',
          title: 'Growth Opportunity',
          description: `With focused improvements, you could match the average score of ${Math.round(avgScore)}`,
        });
      }
    }

    // Market concentration
    const topIndustries = marketData.slice(0, 3);
    if (topIndustries.length > 0) {
      insights.push({
        icon: '📊',
        title: 'Market Leaders',
        description: topIndustries
          .map((ind) => `${ind.industry} (${Math.round(ind.avg_score)}/100)`)
          .join(', '),
      });
    }

    // Variability
    if (stats.max_score && stats.min_score) {
      const range = stats.max_score - stats.min_score;
      if (range > 30) {
        insights.push({
          icon: '💡',
          title: 'High Variability',
          description: `Scores range from ${stats.min_score} to ${stats.max_score}, showing diverse maturity levels`,
        });
      }
    }

    return insights;
  };

  const marketInsights = generateMarketInsights();

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <div>
                <h1 className="main-title" style={{ margin: 0 }}>
                  Market Analysis Dashboard
                </h1>
                <p className="subtitle" style={{ margin: '0.25rem 0 0 0' }}>
                  Competitive positioning & industry benchmarks
                </p>
              </div>
            </div>
            <button className="back-button" onClick={onBack} style={{ height: 'fit-content' }}>
              ← Back
            </button>
          </div>
        </div>

        {/* User Position Card */}
        {userScore && (
          <div className="position-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ margin: 0 }}>📍 Your Position in Market</h2>
              <div style={{ fontSize: '0.9rem', color: '#34a83a', fontWeight: '700' }}>
                Percentile: {userPercentile}%
              </div>
            </div>
            <div className="position-grid">
              <div className="position-stat">
                <div className="stat-label">Your Score</div>
                <div className="stat-value" style={{ color: '#34a83a', fontSize: '2rem' }}>
                  {userScore}
                  <span style={{ fontSize: '1rem', color: '#999' }}>/100</span>
                </div>
              </div>
              <div className="position-stat">
                <div className="stat-label">Industry</div>
                <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                  {titleize(userIndustry || 'General')}
                </div>
              </div>
              <div className="position-stat">
                <div className="stat-label">Market Average</div>
                <div className="stat-value" style={{ color: '#ff9800', fontSize: '1.8rem' }}>
                  {Math.round(stats?.avg_score || 0)}
                  <span style={{ fontSize: '0.9rem', color: '#999' }}>/100</span>
                </div>
              </div>
              <div className="position-stat">
                <div className="stat-label">Difference</div>
                <div
                  className="stat-value"
                  style={{
                    color: userScore > (stats?.avg_score || 0) ? '#34a83a' : '#f44336',
                    fontSize: '1.8rem',
                  }}
                >
                  {userScore > (stats?.avg_score || 0) ? '+' : ''}
                  {Math.round((userScore || 0) - (stats?.avg_score || 0))}
                </div>
              </div>
            </div>

            {/* Positioning Insight */}
            <div className="positioning-insight">
              {userScore > (stats?.avg_score || 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                  <div>
                    <strong style={{ color: '#34a83a' }}>Above average:</strong> Your assessment
                    scores higher than the typical circular economy project in the database.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>→</span>
                  <div>
                    <strong style={{ color: '#ff9800' }}>Opportunity ahead:</strong> Review
                    recommendations to strengthen your proposal and reach the market average.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Statistics */}
        {stats && (
          <div className="stats-card">
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 0 1.5rem 0',
              }}
            >
              📊 Market Overview{' '}
              <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '400' }}>
                (All {stats.total_assessments} Assessments)
              </span>
            </h2>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-name">Total Assessments</div>
                <div className="stat-number">{stats.total_assessments}</div>
              </div>
              <div className="stat-box">
                <div className="stat-name">Average Score</div>
                <div className="stat-number" style={{ color: '#ff9800' }}>
                  {Math.round(stats.avg_score)}/100
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-name">Median Score</div>
                <div className="stat-number" style={{ color: '#4a90e2' }}>
                  {Math.round(stats.median_score)}/100
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-name">Top Score</div>
                <div className="stat-number" style={{ color: '#34a83a' }}>
                  {stats.max_score}/100
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-name">Lowest Score</div>
                <div className="stat-number" style={{ color: '#999' }}>
                  {stats.min_score}/100
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-name">Industries Tracked</div>
                <div className="stat-number" style={{ color: '#9c27b0' }}>
                  {stats.total_industries}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Insights */}
        {marketInsights && marketInsights.length > 0 && (
          <div className="insights-card">
            <h2>📈 Key Market Insights</h2>
            <div className="insights-grid">
              {marketInsights.map((insight, idx) => (
                <div key={idx} className="insight-box">
                  <div className="insight-icon">{insight.icon}</div>
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="analysis-controls-enhanced">
          <label style={{ fontWeight: '600', color: '#2c3e50' }}>🔍 Filter by Scale:</label>
          <select
            value={filterScale}
            onChange={(e) => setFilterScale(e.target.value)}
            className="filter-select"
          >
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
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 0 1.5rem 0',
              }}
            >
              📈 Score Distribution by Industry
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="x"
                  name="Average Score"
                  label={{
                    value: 'Average Score (0-100)',
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                  type="number"
                  domain={[0, 100]}
                />
                <YAxis
                  dataKey="y"
                  name="Project Index"
                  label={{ value: 'Industry/Scale Groups', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="tooltip-box">
                          <p style={{ fontWeight: '700', color: '#34a83a' }}>
                            {titleize(data.industry)} • {data.scale}
                          </p>
                          <p style={{ color: '#666' }}>
                            Average Score: <strong>{data.x.toFixed(1)}/100</strong>
                          </p>
                          <p style={{ color: '#666' }}>
                            Projects Evaluated: <strong>{data.count}</strong>
                          </p>
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
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 0 1.5rem 0',
              }}
            >
              🏆 Industry Benchmarks
            </h2>
            <table className="benchmarks-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1rem' }}>Industry</th>
                  <th>Scale</th>
                  <th>Projects</th>
                  <th>Avg Score</th>
                  <th style={{ paddingRight: '1rem' }}>Range</th>
                </tr>
              </thead>
              <tbody>
                {marketData
                  .filter((item) => filterScale === 'all' || item.scale === filterScale)
                  .sort((a, b) => b.avg_score - a.avg_score)
                  .map((item, idx) => (
                    <tr key={idx} className="benchmark-row">
                      <td className="industry-name" style={{ paddingLeft: '1rem' }}>
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
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
                      <td>{titleize(item.scale)}</td>
                      <td className="count">{item.count}</td>
                      <td className="score">
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
                          {item.avg_score.toFixed(1)}/100
                        </span>
                      </td>
                      <td
                        className="range"
                        style={{ paddingRight: '1rem', fontSize: '0.9rem', color: '#999' }}
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
        <div className="insights-card">
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 0 1.5rem 0',
              color: '#4a90e2',
            }}
          >
            💡 Key Market Insights
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                borderLeft: '4px solid #34a83a',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🎯</div>
              <div
                style={{
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Top Performers
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                Projects in <strong>Energy</strong> and <strong>Water</strong> industries tend to
                score highest on circular economy metrics
              </div>
            </div>
            <div
              style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                borderLeft: '4px solid #ff9800',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📈</div>
              <div
                style={{
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Growth Opportunity
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                Emerging industries show varied scores—there's significant room for specialized
                innovation and differentiation
              </div>
            </div>
            <div
              style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                borderLeft: '4px solid #9c27b0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>💼</div>
              <div
                style={{
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Scale Factor
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                Larger, commercial-stage projects generally score higher than prototypes and
                early-stage initiatives
              </div>
            </div>
            <div
              style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                borderLeft: '4px solid #f44336',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⭐</div>
              <div
                style={{
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                Your Advantage
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                Focus on your unique circular strategy and value proposition to differentiate in
                your market segment
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="market-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e0e0e0',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <button className="back-button" onClick={onBack}>
            ← Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
