import { useEffect, useState } from 'react';
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
import '../styles/ComparisonView.css';

export default function ComparisonView({ onBack }) {
  const { id1, id2 } = useParams();
  const navigate = useNavigate();
  const [assessment1, setAssessment1] = useState(null);
  const [assessment2, setAssessment2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchAssessments();
  }, [id1, id2]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${apiBase}/assessments/${id1}`),
        fetch(`${apiBase}/assessments/${id2}`),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      setAssessment1(data1.assessment);
      setAssessment2(data2.assessment);
      setError(null);
    } catch (err) {
      setError('Failed to load assessments for comparison');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="app-container">
        <p>Loading assessments...</p>
      </div>
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

  const compareMetric = (label, val1, val2, unit = '') => {
    const diff = val2 - val1;
    const change = diff > 0 ? `+${diff}` : `${diff}`;
    const color = diff > 0 ? '#28a745' : diff < 0 ? '#dc3545' : '#999';

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
        <div className="metric-change" style={{ color }}>
          {change}
          {unit}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="comparison-view">
        {/* Header */}
        <div className="header-section">
          <h1 className="main-title">Assessment Comparison</h1>
          <p className="subtitle">Side-by-side analysis of two evaluations</p>
        </div>

        {/* Assessment Titles */}
        <div className="comparison-header">
          <div className="assessment-title assessment1">
            <h2>{assessment1.title || 'Assessment 1'}</h2>
            <p>{new Date(assessment1.created_at).toLocaleDateString()}</p>
          </div>
          <div className="comparison-title">vs.</div>
          <div className="assessment-title assessment2">
            <h2>{assessment2.title || 'Assessment 2'}</h2>
            <p>{new Date(assessment2.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Overall Scores */}
        <div className="comparison-card">
          <h3>Overall Scores</h3>
          <div className="metric-row">
            <div className="metric-label">Overall Score</div>
            <div className="metric-value assessment1">
              <strong style={{ fontSize: '1.5rem', color: '#34a83a' }}>
                {assessment1.result_json?.overall_score}/100
              </strong>
            </div>
            <div className="metric-value assessment2">
              <strong style={{ fontSize: '1.5rem', color: '#34a83a' }}>
                {assessment2.result_json?.overall_score}/100
              </strong>
            </div>
            <div className="metric-change">
              {assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
                ? '✓ Improved'
                : '↓ Changed'}
            </div>
          </div>
        </div>

        {/* Sub-Scores Comparison */}
        <div className="comparison-card">
          <h3>Factor Scores</h3>
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
          <h3>Project Classification</h3>
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
          <h3>Audit Verdicts</h3>
          <div className="verdict-comparison">
            <div className="verdict-box assessment1">
              <h4>Assessment 1</h4>
              <p>{assessment1.result_json?.audit?.audit_verdict || 'No verdict available'}</p>
            </div>
            <div className="verdict-box assessment2">
              <h4>Assessment 2</h4>
              <p>{assessment2.result_json?.audit?.audit_verdict || 'No verdict available'}</p>
            </div>
          </div>
        </div>

        {/* Factor Scores Visualization */}
        {assessment1.result_json?.sub_scores && assessment2.result_json?.sub_scores && (
          <div className="comparison-card">
            <h3>Score Distribution Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={Object.keys(assessment1.result_json.sub_scores).map((key) => ({
                  name: key.replace(/_/g, ' ').slice(0, 12),
                  'Assessment 1': assessment1.result_json.sub_scores[key],
                  'Assessment 2': assessment2.result_json.sub_scores[key],
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Assessment 1" fill="#34a83a" />
                <Bar dataKey="Assessment 2" fill="#007bff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radar Chart for Multi-Factor Comparison */}
        {assessment1.result_json?.sub_scores && assessment2.result_json?.sub_scores && (
          <div className="comparison-card">
            <h3>Multi-Factor Profile</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart
                data={Object.keys(assessment1.result_json.sub_scores).map((key) => ({
                  factor: key.replace(/_/g, ' ').slice(0, 15),
                  'Assessment 1': assessment1.result_json.sub_scores[key],
                  'Assessment 2': assessment2.result_json.sub_scores[key],
                }))}
                margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Assessment 1"
                  dataKey="Assessment 1"
                  stroke="#34a83a"
                  fill="#34a83a"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Assessment 2"
                  dataKey="Assessment 2"
                  stroke="#007bff"
                  fill="#007bff"
                  fillOpacity={0.6}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Key Insights */}
        <div className="comparison-card insights">
          <h3>Key Insights</h3>
          <ul>
            <li>
              <strong>Score Trend:</strong>{' '}
              {assessment2.result_json?.overall_score > assessment1.result_json?.overall_score
                ? '📈 Score improved'
                : assessment2.result_json?.overall_score < assessment1.result_json?.overall_score
                  ? '📉 Score declined'
                  : '↔️ Score unchanged'}
            </li>
            {assessment1.result_json?.metadata?.industry !==
              assessment2.result_json?.metadata?.industry && (
              <li>
                <strong>Industry Change:</strong>{' '}
                {titleize(assessment1.result_json?.metadata?.industry)} →{' '}
                {titleize(assessment2.result_json?.metadata?.industry)}
              </li>
            )}
            <li>
              <strong>Assessed:</strong> {new Date(assessment1.created_at).toLocaleDateString()} vs.{' '}
              {new Date(assessment2.created_at).toLocaleDateString()}
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="comparison-footer">
          <button className="back-button" onClick={onBack}>
            ← Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
