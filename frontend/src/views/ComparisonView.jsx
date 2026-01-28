import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { exportComparisonCSV } from '../utils/exportSimple';
import '../styles/ComparisonView.css';
import Loader from '../components/feedback/Loader';

export default function ComparisonView({ onBack }) {
  const { id1, id2 } = useParams();
  const navigate = useNavigate();
  const [assessment1, setAssessment1] = useState(null);
  const [assessment2, setAssessment2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  //for <ResponsiveContainer> radar chart...........................
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Smart label formatting with abbreviations
  const formatLabel = (label) => {
    if (!isMobile) return label;

    // Common word abbreviations for mobile
    const abbreviations = {
      participation: 'particip.',
      efficiency: 'effic.',
      infrastructure: 'infrastr.',
      readiness: 'ready.',
      maintenance: 'maint.',
      chemical: 'chem.',
      safety: 'safe.',
    };

    let formatted = label;
    Object.entries(abbreviations).forEach(([full, abbr]) => {
      formatted = formatted.replace(new RegExp(full, 'gi'), abbr);
    });

    // Truncate if still too long
    return formatted.length > 12 ? formatted.substring(0, 11) + '.' : formatted;
  };
  // Custom tick component for multi-line labels on mobile
  const CustomTick = ({ payload, x, y, textAnchor, isMobile }) => {
    const label = payload.value;
    const words = label.split(' ');

    // Split into two lines if mobile and label is long
    if (isMobile && words.length > 1) {
      return (
        <g transform={`translate(${x},${y})`}>
          <text
            x={0}
            y={0}
            dy={-5}
            textAnchor={textAnchor}
            fill="#555"
            fontSize={10}
            fontWeight={500}
          >
            {words[0]}
          </text>
          <text
            x={0}
            y={0}
            dy={8}
            textAnchor={textAnchor}
            fill="#555"
            fontSize={10}
            fontWeight={500}
          >
            {words.slice(1).join(' ')}
          </text>
        </g>
      );
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor={textAnchor}
          fill="#555"
          fontSize={isMobile ? 10 : 14}
          fontWeight={500}
        >
          {label}
        </text>
      </g>
    );
  };
  //..................................................................

  useEffect(() => {
    fetchAssessments();
  }, [id1, id2]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${API_URL}/assessments/${id1}`),
        fetch(`${API_URL}/assessments/${id2}`),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      setAssessment1(data1.assessment);
      setAssessment2(data2.assessment);
      setError(null);
    } catch (err) {
      setError('Failed to load assessments for comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Loader heading="Loading comparison..." message="Fetching assessment data for comparison." />
    );
  if (error)
    return (
      <div className="app-container">
        <p className="error">{error}</p>
      </div>
    );
  if (!assessment1 || !assessment2)
    return (
      <div className="app-container">
        <p>Assessment not found</p>
      </div>
    );

  const titleize = (txt) =>
    txt
      ? String(txt)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : 'N/A';

  const factorDiffs = Object.keys(assessment1.result_json?.sub_scores || {}).map((key) => {
    const a1 = assessment1.result_json?.sub_scores?.[key] || 0;
    const a2 = assessment2.result_json?.sub_scores?.[key] || 0;
    return {
      factor: key,
      label: titleize(key),
      diff: a2 - a1,
      a1,
      a2,
    };
  });

  const overallDelta =
    (assessment2.result_json?.overall_score || 0) - (assessment1.result_json?.overall_score || 0);
  const biggestGain =
    factorDiffs.filter((f) => f.diff > 0).sort((a, b) => b.diff - a.diff)[0] || null;
  const biggestDrop =
    factorDiffs.filter((f) => f.diff < 0).sort((a, b) => a.diff - b.diff)[0] || null;
  const averageDelta =
    factorDiffs.length > 0
      ? Math.round(factorDiffs.reduce((sum, f) => sum + f.diff, 0) / factorDiffs.length)
      : 0;

  const compareMetric = (label, val1, val2, unit = '') => {
    const diff = val2 - val1;
    const change = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
    const changeClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';

    return (
      <div className="comparison-row">
        <div className="metric-label">{label}</div>
        <div className="metric-value assessment1">
          {val1}
          {unit}
        </div>
        <div className="metric-value assessment2">
          {val2}
          {unit}
        </div>
        <div className={`metric-change ${changeClass}`}>
          {change}
          {unit}
        </div>
      </div>
    );
  };

  // Generate insights
  const generateInsights = () => {
    const score1 = assessment1.result_json?.overall_score || 0;
    const score2 = assessment2.result_json?.overall_score || 0;
    const diff = score2 - score1;
    const insights = [];

    // Overall trend
    if (diff > 5) {
      insights.push({
        type: 'positive',
        emoji: '📈',
        text: `Significant improvement: ${diff} point gain from ${score1} to ${score2}`,
      });
    } else if (diff > 0) {
      insights.push({
        type: 'positive',
        emoji: '📈',
        text: `Modest improvement: ${diff} point increase`,
      });
    } else if (diff < -5) {
      insights.push({
        type: 'negative',
        emoji: '📉',
        text: `Decline detected: ${Math.abs(diff)} point drop from ${score1} to ${score2}`,
      });
    } else if (diff < 0) {
      insights.push({
        type: 'negative',
        emoji: '📉',
        text: `Minor decline: ${Math.abs(diff)} point decrease`,
      });
    } else {
      insights.push({ type: 'neutral', emoji: '➡️', text: 'Overall scores remain stable' });
    }

    // Strongest and weakest factors
    const strongest = factorDiffs.reduce((a, b) => (a.diff > b.diff ? a : b), factorDiffs[0] || {});
    const weakest = factorDiffs.reduce((a, b) => (a.diff < b.diff ? a : b), factorDiffs[0] || {});

    if (strongest && strongest.diff > 2) {
      insights.push({
        type: 'positive',
        emoji: '⭐',
        text: `Strongest improvement in ${strongest.label || titleize(strongest.factor)} (+${strongest.diff} points)`,
      });
    }

    if (weakest && weakest.diff < -2) {
      insights.push({
        type: 'negative',
        emoji: '⚠️',
        text: `Notable decline in ${weakest.label || titleize(weakest.factor)} (${weakest.diff} points)`,
      });
    }

    // Top performer
    const sub2 = assessment2.result_json?.sub_scores || {};
    const topScore = Math.max(...Object.values(sub2));
    const topFactor = Object.keys(sub2).find((k) => sub2[k] === topScore);
    if (topFactor && topScore >= 80) {
      insights.push({
        type: 'positive',
        emoji: '💪',
        text: `${topFactor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} is a strength (${topScore}/100)`,
      });
    }

    // Areas needing work
    const lowScore = Math.min(...Object.values(sub2));
    const lowFactor = Object.keys(sub2).find((k) => sub2[k] === lowScore);
    if (lowFactor && lowScore < 50) {
      insights.push({
        type: 'negative',
        emoji: '🎯',
        text: `Priority improvement: ${lowFactor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} (${lowScore}/100)`,
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="app-container">
      <div className="comparison-view">
        {/* Header */}
        <div
          className="header-section"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2.5rem',
          }}
        >
          <h1 className="main-title" style={{ margin: 0 }}>
            Assessment Comparison
          </h1>
          <p className="subtitle" style={{ margin: '0.5rem 0 0 0' }}>
            Side-by-side analysis of {assessment1.title} and {assessment2.title}
          </p>
        </div>

        {/* Key Insights Section */}
        {insights && insights.length > 0 && (
          <div className="comparison-card insights-card">
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 0 1.5rem 0',
              }}
            >
              💡 Key Insights
            </h3>
            <div className="insights-list">
              {insights.map((insight, idx) => (
                <div key={idx} className={`insight-item insight-${insight.type}`}>
                  <span className="insight-emoji">{insight.emoji}</span>
                  <span className="insight-text">{insight.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Snapshot */}
        <div className="comparison-card delta-card">
          <h3
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0' }}
          >
            📈 Change Snapshot
          </h3>
          <div className="summary-grid">
            <div
              className="summary-tile"
              title="Total change in overall score from assessment 1 to assessment 2"
              style={{
                borderLeft: `4px solid ${overallDelta > 0 ? '#34a83a' : overallDelta < 0 ? '#f44336' : '#999'}`,
              }}
            >
              <div className="summary-label">Overall Change</div>
              <div
                className={`summary-value ${
                  overallDelta > 0 ? 'positive' : overallDelta < 0 ? 'negative' : 'neutral'
                }`}
              >
                {overallDelta > 0 ? '+' : ''}
                {overallDelta}
              </div>
              <div className="summary-note">Assessment 2 vs 1</div>
            </div>

            {biggestGain && (
              <div
                className="summary-tile"
                title={`${biggestGain.label} showed the largest improvement`}
                style={{ borderLeft: '4px solid #34a83a' }}
              >
                <div className="summary-label">Biggest Gain</div>
                <div className="summary-value positive">
                  +{biggestGain.diff}
                  <span className="summary-unit"> pts</span>
                </div>
                <div className="summary-note">{biggestGain.label}</div>
              </div>
            )}

            {biggestDrop && (
              <div
                className="summary-tile"
                title={`${biggestDrop.label} showed the largest decline`}
                style={{ borderLeft: '4px solid #f44336' }}
              >
                <div className="summary-label">Largest Drop</div>
                <div className="summary-value negative">
                  {biggestDrop.diff}
                  <span className="summary-unit"> pts</span>
                </div>
                <div className="summary-note">{biggestDrop.label}</div>
              </div>
            )}

            <div
              className="summary-tile"
              title="Average change across all evaluation factors"
              style={{
                borderLeft: `4px solid ${averageDelta > 0 ? '#34a83a' : averageDelta < 0 ? '#f44336' : '#999'}`,
              }}
            >
              <div className="summary-label">Average Factor Shift</div>
              <div
                className={`summary-value ${averageDelta > 0 ? 'positive' : averageDelta < 0 ? 'negative' : 'neutral'}`}
              >
                {averageDelta > 0 ? '+' : ''}
                {averageDelta}
                <span className="summary-unit"> pts</span>
              </div>
              <div className="summary-note">Across all factors</div>
            </div>
          </div>
        </div>

        {/* Assessment Titles */}
        <div className="comparison-header">
          <div className="assessment-title assessment1">
            <h2>{assessment1.title || 'Assessment 1'}</h2>
            <p>
              {new Date(assessment1.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
          <div className="comparison-title">vs.</div>
          <div className="assessment-title assessment2">
            <h2>{assessment2.title || 'Assessment 2'}</h2>
            <p>
              {new Date(assessment2.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
        </div>

        {/* Overall Scores with Enhanced Visual */}
        <div className="comparison-card">
          <h3>Overall Score Comparison</h3>
          <div className="score-comparison-grid">
            <div className="score-box assessment1">
              <div className="score-label">Assessment 1</div>
              <div className="score-value">{assessment1.result_json?.overall_score}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>/ 100</div>
              <div className="score-label" style={{ marginTop: '1rem' }}>
                {assessment1.title || 'Assessment 1'}
              </div>
            </div>

            <div className="score-box">
              <div className="score-label">Difference</div>
              <div
                className="score-value"
                style={{
                  color:
                    assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
                      ? '#28a745'
                      : assessment2.result_json?.overall_score <
                          assessment1.result_json?.overall_score
                        ? '#dc3545'
                        : '#999',
                }}
              >
                {assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
                  ? '+'
                  : ''}
                {assessment2.result_json?.overall_score - assessment1.result_json?.overall_score}
              </div>
              <div
                className="improvement-indicator"
                style={{
                  color:
                    assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
                      ? '#28a745'
                      : assessment2.result_json?.overall_score <
                          assessment1.result_json?.overall_score
                        ? '#dc3545'
                        : '#999',
                }}
              >
                {assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
                  ? '📈 Improved'
                  : assessment2.result_json?.overall_score < assessment1.result_json?.overall_score
                    ? '📉 Declined'
                    : '➡️ Unchanged'}
              </div>
            </div>

            <div className="score-box assessment2">
              <div className="score-label">Assessment 2</div>
              <div className="score-value" style={{ color: '#4a90e2' }}>
                {assessment2.result_json?.overall_score}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>/ 100</div>
              <div className="score-label" style={{ marginTop: '1rem' }}>
                {assessment2.title || 'Assessment 2'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Scores Comparison */}
        <div className="comparison-card">
          <h3
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0' }}
          >
            📊 Factor Scores Comparison
          </h3>
          <div className="comparison-table">
            {Object.entries(assessment1.result_json?.sub_scores || {}).map(([factor, val1]) => {
              const val2 = assessment2.result_json?.sub_scores?.[factor] || 0;
              return compareMetric(
                factor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                val1,
                val2,
              );
            })}
          </div>
        </div>

        {/* Metadata Comparison */}
        <div className="comparison-card">
          <h3
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0' }}
          >
            🏢 Project Details
          </h3>
          <div className="comparison-table">
            {compareMetric(
              'Industry',
              titleize(assessment1.result_json?.metadata?.industry),
              titleize(assessment2.result_json?.metadata?.industry),
            )}
            {compareMetric(
              'Scale',
              titleize(assessment1.result_json?.metadata?.scale),
              titleize(assessment2.result_json?.metadata?.scale),
            )}
            {compareMetric(
              'Strategy',
              titleize(assessment1.result_json?.metadata?.r_strategy),
              titleize(assessment2.result_json?.metadata?.r_strategy),
            )}
            {compareMetric(
              'Material',
              titleize(assessment1.result_json?.metadata?.primary_material),
              titleize(assessment2.result_json?.metadata?.primary_material),
            )}
          </div>
        </div>

        {/* Benchmark Comparison */}
        {assessment1.result_json?.gap_analysis?.overall_benchmarks &&
          assessment2.result_json?.gap_analysis?.overall_benchmarks && (
            <div className="comparison-card">
              <h3>Benchmarking vs. Similar Projects</h3>
              <div className="comparison-table">
                {compareMetric(
                  'vs. Similar Avg',
                  Math.round(assessment1.result_json.gap_analysis.overall_benchmarks.average),
                  Math.round(assessment2.result_json.gap_analysis.overall_benchmarks.average),
                )}
                {compareMetric(
                  'vs. Top 10%',
                  assessment1.result_json.gap_analysis.overall_benchmarks.top_10_percentile,
                  assessment2.result_json.gap_analysis.overall_benchmarks.top_10_percentile,
                )}
              </div>
            </div>
          )}

        {/* Audit Verdicts */}
        <div className="comparison-card">
          <h3>🔍 Auditor&apos;s Verdict</h3>
          <div className="verdict-comparison">
            <div className="verdict-box assessment1">
              <h4>{assessment1.title}</h4>
              <p>{assessment1.result_json?.audit?.audit_verdict || 'No verdict available'}</p>
            </div>
            <div className="verdict-box assessment2">
              <h4>{assessment2.title}</h4>
              <p>{assessment2.result_json?.audit?.audit_verdict || 'No verdict available'}</p>
            </div>
          </div>
        </div>

        {/* Factor Scores Visualization */}
        {assessment1.result_json?.sub_scores && assessment2.result_json?.sub_scores && (
          <div className="comparison-card">
            <h3>📊 Score Distribution Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={Object.keys(assessment1.result_json.sub_scores).map((key) => ({
                  name: key.replace(/_/g, ' '),
                  [assessment1.title]: assessment1.result_json.sub_scores[key],
                  [assessment2.title]: assessment2.result_json.sub_scores[key],
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-30}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey={assessment1.title} fill="#34a83a" barSize={28} />
                <Bar dataKey={assessment2.title} fill="#007bff" barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radar Chart for Multi-Factor Comparison */}
        {assessment1.result_json?.sub_scores && assessment2.result_json?.sub_scores && (
          <div className="comparison-card">
            <h3>🎯 Multi-Factor Profile</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 380 : isTablet ? 450 : 500}>
              <RadarChart
                data={Object.keys(assessment1.result_json.sub_scores).map((key) => ({
                  factor: formatLabel(key.replace(/_/g, ' ')),
                  fullFactor: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // Title case for tooltip
                  'Assessment 1': assessment1.result_json.sub_scores[key],
                  'Assessment 2': assessment2.result_json.sub_scores[key],
                }))}
                margin={{
                  top: isMobile ? 25 : 30,
                  right: isMobile ? 25 : isTablet ? 70 : 120,
                  bottom: isMobile ? 25 : 30,
                  left: isMobile ? 25 : isTablet ? 70 : 120,
                }}
              >
                <PolarGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <PolarAngleAxis
                  dataKey="factor"
                  tick={<CustomTick isMobile={isMobile} />}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: isMobile ? 9 : 10 }}
                  tickCount={5}
                  stroke="#ddd"
                />
                <Radar
                  name={assessment1.title}
                  dataKey="Assessment 1"
                  stroke="#34a83a"
                  fill="#34a83a"
                  fillOpacity={0.5}
                  strokeWidth={isMobile ? 2 : 2.5}
                />
                <Radar
                  name={assessment2.title}
                  dataKey="Assessment 2"
                  stroke="#007bff"
                  fill="#007bff"
                  fillOpacity={0.5}
                  strokeWidth={isMobile ? 2 : 2.5}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: isMobile ? '15px' : '20px',
                    fontSize: isMobile ? '12px' : '14px',
                  }}
                  iconSize={isMobile ? 10 : 14}
                  iconType="square"
                />
                <Tooltip
                  contentStyle={{
                    fontSize: isMobile ? '12px' : '14px',
                    padding: isMobile ? '8px' : '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                  }}
                  labelFormatter={(label) => {
                    const item = data.find((d) => d.factor === label);
                    return item?.fullFactor || label;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Key Insights */}
        <div className="comparison-card insights">
          <h3>Key Insights</h3>
          <ul>
            <li>
              <strong>Score Trend:</strong>&nbsp;
              {assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
                ? '📈 Score improved'
                : assessment2.result_json?.overall_score < assessment1.result_json?.overall_score
                  ? '📉 Score declined'
                  : '↔️ Score unchanged'}
            </li>
            {assessment1.result_json?.metadata?.industry !==
              assessment2.result_json?.metadata?.industry && (
              <li>
                <strong>Industry Change:</strong>&nbsp;
                {titleize(assessment1.result_json?.metadata?.industry)} →&nbsp;
                {titleize(assessment2.result_json?.metadata?.industry)}
              </li>
            )}
            <li>
              <strong>Assessed:</strong>&nbsp;<span className="font-bold">{assessment1.title}</span>
              &nbsp;(
              {new Date(assessment1.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
              )&nbsp;&nbsp;vs.&nbsp;&nbsp;<span className="font-bold">{assessment2.title}</span>
              &nbsp;(
              {new Date(assessment2.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
              )
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center justify-center gap-4 pt-8 mt-12 border-t-2 border-gray-300 assessmentComparisionFooter:flex-row assessmentComparisionFooter:justify-between">
          <p className="font-medium text-slate-400">
            Last updated:&nbsp;
            {new Date().toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              className="secondary-button"
              title="Export comparison as CSV"
              onClick={() => exportComparisonCSV(assessment1, assessment2)}
            >
              📤 Export Comparison (CSV)
            </button>
            <button className="back-button" onClick={onBack}>
              ← Back to Assessments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ComparisonView.propTypes = {
  onBack: PropTypes.func,
};

ComparisonView.defaultProps = {
  onBack: null,
};
