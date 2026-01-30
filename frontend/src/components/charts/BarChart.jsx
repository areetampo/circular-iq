import React from 'react';
import PropTypes from 'prop-types';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function BarChart({
  data,
  barConfigs,
  height,
  showLegend,
  showGrid,
  yAxisDomain,
  xAxisLabel,
  yAxisLabel,
}) {
  // Format data for display
  const chartData = data.map((item) => ({
    ...item,
    name: item.name || item.factor || item.subject || 'Unknown',
  }));

  return (
    <ResponsiveContainer width="100%" height={height || 400}>
      <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, bottom: 80, left: 60 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
            strokeOpacity={0.6}
          />
        )}
        <XAxis
          dataKey="name"
          label={
            xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined
          }
          tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500, angle: -30, textAnchor: 'end' }}
          height={80}
          interval={0}
          stroke="#94a3b8"
          tickLine={false}
        />
        <YAxis
          domain={yAxisDomain}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
          stroke="#94a3b8"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            padding: '12px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{
              paddingTop: '15px',
              fontSize: '13px',
              fontWeight: '600',
            }}
            iconSize={14}
            iconType="square"
          />
        )}

        {barConfigs.map((config, index) => (
          <Bar
            key={index}
            dataKey={config.dataKey}
            fill={config.fill}
            name={config.name || config.dataKey}
            radius={[4, 4, 0, 0]}
          >
            {config.useCustomColors &&
              chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={config.fill} opacity={0.9} />
              ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      factor: PropTypes.string,
      subject: PropTypes.string,
    }),
  ).isRequired,
  barConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      fill: PropTypes.string.isRequired,
      name: PropTypes.string,
      useCustomColors: PropTypes.bool,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showGrid: PropTypes.bool,
  yAxisDomain: PropTypes.arrayOf(PropTypes.number),
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
};

BarChart.defaultProps = {
  height: 400,
  showLegend: true,
  showGrid: true,
  yAxisDomain: [0, 100],
  xAxisLabel: '',
  yAxisLabel: '',
};
