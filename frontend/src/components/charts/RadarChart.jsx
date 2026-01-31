import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

export default function RadarChart({
  data,
  radarConfigs,
  height,
  showLegend,
  showTooltip,
  isLoading,
}) {
  // Memoize data transformation to prevent expensive re-calculations
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        subject: item.subject || item.factor || item.name || 'Unknown',
      })),
    [data],
  );

  return (
    <div
      style={{
        position: 'relative',
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <ResponsiveContainer width="100%" height={height || 500}>
        <RechartsRadarChart
          data={chartData}
          margin={{ top: 30, right: 120, bottom: 30, left: 120 }}
        >
          <PolarGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: '#64748b',
              fontSize: 14,
              fontWeight: 500,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickCount={5}
            stroke="#ddd"
          />

          {radarConfigs.map((config, index) => (
            <Radar
              key={index}
              name={config.name}
              dataKey={config.dataKey}
              stroke={config.stroke}
              fill={config.fill}
              fillOpacity={config.fillOpacity || 0.5}
              strokeWidth={config.strokeWidth || 2}
            />
          ))}

          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                fontWeight: '600',
              }}
              iconSize={14}
              iconType="square"
            />
          )}

          {showTooltip && (
            <Tooltip
              contentStyle={{
                fontSize: '14px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
              }}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

RadarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      subject: PropTypes.string,
      factor: PropTypes.string,
      name: PropTypes.string,
    }),
  ).isRequired,
  radarConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      dataKey: PropTypes.string.isRequired,
      stroke: PropTypes.string.isRequired,
      fill: PropTypes.string.isRequired,
      fillOpacity: PropTypes.number,
      strokeWidth: PropTypes.number,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showTooltip: PropTypes.bool,
  isLoading: PropTypes.bool,
};

RadarChart.defaultProps = {
  height: 500,
  showLegend: true,
  showTooltip: true,
  isLoading: false,
};
