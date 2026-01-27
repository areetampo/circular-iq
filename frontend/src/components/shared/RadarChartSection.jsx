import React from 'react';
import PropTypes from 'prop-types';
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
    <div className="p-8 mb-6 bg-white shadow-md rounded-2xl">
      <h2 className="mb-2 text-2xl font-semibold text-slate-800">Performance Comparison</h2>
      <p className="mb-6 text-slate-600">Your idea vs. market average</p>
      <div className="my-4">
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
      <div className="flex flex-wrap justify-center gap-8 mt-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <div className="w-4 h-4 rounded" style={{ background: '#34a83a' }}></div>
          <span>Your Idea</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <div className="w-4 h-4 rounded" style={{ background: '#4a90e2' }}></div>
          <span>Market Average</span>
        </div>
      </div>
    </div>
  );
}

RadarChartSection.propTypes = {
  radarData: PropTypes.arrayOf(
    PropTypes.shape({
      subject: PropTypes.string.isRequired,
      marketAvg: PropTypes.number,
      userValue: PropTypes.number,
    }),
  ),
};

RadarChartSection.defaultProps = {
  radarData: [],
};
