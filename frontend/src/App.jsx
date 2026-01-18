import { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

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
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Transform sub_scores to array for RadarChart
  const radarData = result
    ? Object.entries(result.sub_scores).map(([key, value]) => ({
        subject: key.replace(/_/g, ' '),
        value,
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
        <div style={{ marginTop: 20 }}>
          <h3>Overall Score: {result.overall_score}</h3>

          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <p>{result.reasoning}</p>
        </div>
      )}
    </div>
  );
}
