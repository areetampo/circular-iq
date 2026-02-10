import React from 'react';
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LineChart({
  data,
  lines = [{ dataKey: 'value', stroke: 'hsl(200, 100%, 50%)', name: 'Value' }],
  xAxisKey = 'name',
  height = 300,
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height: `${height}px` }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLine data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 85%)" vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12, fill: 'hsl(0, 0%, 50%)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value) => value.toLocaleString()}
          tick={{ fontSize: 12, fill: 'hsl(0, 0%, 50%)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '15px' }} />
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2.5}
            name={line.name}
            dot={{ r: 5, fill: line.stroke }}
            activeDot={{ r: 7 }}
            isAnimationActive={true}
          />
        ))}
      </RechartsLine>
    </ResponsiveContainer>
  );
}
