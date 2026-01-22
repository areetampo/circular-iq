import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export default function RadarChartSection({ radarData }) {
  if (!radarData || radarData.length === 0) return null;

  return (
    <div className="radar-card">
      <h2>Performance Comparison</h2>
      <p className="radar-description">Your idea vs. market average</p>
      <div className="radar-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#999', fontSize: 10 }} />
            <Radar
              name="Market Average"
              dataKey="marketAvg"
              stroke="#4a90e2"
              fill="#4a90e2"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="Your Idea"
              dataKey="userValue"
              stroke="#34a83a"
              fill="#34a83a"
              fillOpacity={0.4}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="radar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#34a83a' }}></div>
          <span>Your Idea</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#4a90e2' }}></div>
          <span>Market Average</span>
        </div>
      </div>
    </div>
  );
}
