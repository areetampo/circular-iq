import { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import Markdown from 'react-markdown';

export default function App() {
  const [idea, setIdea] = useState('');
  const [params, setParams] = useState({
    recyclability: 70,
    energy_efficiency: 60,
    reuse_cycles: 5,
    lifespan_years: 30,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, parameters: params }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      console.log('Full API Response:', data);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 1. Get the average similarity or score from the database matches
  const marketAvg =
    result?.similar_cases?.length > 0
      ? result.similar_cases.reduce((acc, curr) => acc + curr.similarity * 100, 0) /
        result.similar_cases.length
      : 40; // Default fallback

  // 2. Map the data so the chart has two data keys
  const radarData = result
    ? Object.entries(result.sub_scores).map(([key, value]) => ({
        subject: key.replace(/_/g, ' '),
        userValue: value, // What the user claims
        marketAvg: marketAvg, // What the data suggests is normal
      }))
    : [];

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <h2>Circular Economy Scorer</h2>

      <textarea
        rows={4}
        placeholder="Describe your business idea"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      {Object.keys(params).map((key) => (
        <div key={key} style={{ marginBottom: 5 }}>
          <label>{key.replace('_', ' ')}: </label>
          <input
            type="number"
            value={params[key]}
            onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
          />
        </div>
      ))}

      <button onClick={submit} disabled={loading}>
        {loading ? 'Evaluating...' : 'Evaluate'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 30, borderTop: '2px solid #eee', paddingTop: 20 }}>
          {/* 1. JUNK INPUT WARNING */}
          {result?.audit?.is_junk_input ? (
            <div
              style={{
                padding: '20px',
                background: '#fff3cd',
                color: '#856404',
                borderRadius: '8px',
                border: '1px solid #ffeeba',
              }}
            >
              <strong>⚠️ Low Quality Input:</strong>{' '}
              {result?.audit?.audit_verdict || 'Input was too vague to analyze.'}
            </div>
          ) : (
            <>
              <h3>Overall Analysis: {result.overall_score}/100</h3>

              {/* 2. CONFIDENCE PROGRESS BAR */}
              <div style={{ marginBottom: 25 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label>Data Confidence</label>
                  <span>
                    {result?.audit?.confidence_score <= 1
                      ? result.audit.confidence_score * 100
                      : (result.audit.confidence_score ?? 0)}
                    %
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 12,
                    background: '#eee',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${result?.audit?.confidence_score <= 1 ? result.audit.confidence_score * 100 : (result.audit.confidence_score ?? 0)}%`,
                      height: '100%',
                      background:
                        (result?.audit?.confidence_score ?? 0) > 70 ? '#4caf50' : '#ff9800',
                      transition: 'width 1s ease-in-out',
                    }}
                  />
                </div>
              </div>

              {/* 3. RADAR CHART (Keep your existing one here) */}
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  {/* Inside App.jsx - Radar Chart Section */}
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#444" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#999' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />

                    {/* The "Reality" based on your Supabase data */}
                    <Radar
                      name="Market Average"
                      dataKey="marketAvg"
                      stroke="#4a90e2"
                      fill="#4a90e2"
                      fillOpacity={0.2}
                    />

                    {/* Your specific idea */}
                    <Radar
                      name="Your Idea"
                      dataKey="userValue"
                      stroke="#81c784"
                      fill="#81c784"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 4. TECHNICAL AUDIT DETAILS */}
              <div
                style={{
                  background: '#35373a',
                  padding: '20px',
                  borderRadius: '12px',
                  marginTop: 20,
                }}
              >
                <h4>Auditor's Verdict</h4>
                <p style={{ fontStyle: 'italic', color: '#a7a5a5' }}>
                  {result?.audit?.audit_verdict || 'No verdict available'}
                </p>

                <hr />

                <h4>Integrity Gaps</h4>
                <ul style={{ color: '#ff6b6b' }}>
                  {result?.audit?.integrity_gaps?.map((gap, i) => (
                    <li key={i} style={{ marginBottom: '10px' }}>
                      <strong>{gap.issue || gap}</strong>
                      {gap.evidence_source_id && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#888' }}>
                          Source: Confirmed by comparing to Database Case #{gap.evidence_source_id}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <h4>Technical Recommendations</h4>
                <ul style={{ color: '#34a83a' }}>
                  {result?.audit?.technical_recommendations?.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* NEW: COMPARATIVE ANALYSIS SECTION */}
              {result?.audit?.comparative_analysis && (
                <div
                  style={{
                    marginTop: 20,
                    padding: '15px',
                    background: '#2a2d30',
                    borderRadius: '8px',
                    borderLeft: '4px solid #4a90e2',
                  }}
                >
                  <h5 style={{ color: '#4a90e2', margin: '0 0 10px 0' }}>Market Comparison</h5>
                  <p style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: '1.4', margin: 0 }}>
                    {result.audit.comparative_analysis}
                  </p>
                </div>
              )}

              {result?.similar_cases && (
                <div style={{ marginTop: 20 }}>
                  <h4>Reference Cases from Database</h4>
                  {result.similar_cases.map((cas, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '12px',
                        color: '#f5f3f3',
                        marginBottom: 10,
                        padding: 10,
                        border: '1px solid #858484',
                      }}
                    >
                      <strong>Match {(cas.similarity * 100).toFixed(0)}%:</strong>{' '}
                      {cas.content.substring(0, 150)}...
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
