import React from 'react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function PieChart({
  data,
  dataKey,
  nameKey,
  height = 250,
  colors = [
    '#3b82f6',
    '#10b981',
    '#f59e42',
    '#a78bfa',
    '#ef4444',
    '#fbbf24',
    '#6366f1',
    '#f472b6',
    '#22223b',
    '#9d0208',
  ],
  labelType = 'both', // 'count', 'percent', 'both'
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

  const renderLabel = ({ name, value, percent }) => {
    if (labelType === 'count') return `${name}: ${value}`;
    if (labelType === 'percent') return `${name}: ${(percent * 100).toFixed(0)}%`;
    return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    <RePieChart width={height} height={height}>
      <Pie
        data={data}
        dataKey={dataKey}
        nameKey={nameKey}
        cx="50%"
        cy="50%"
        outerRadius={height / 2.5}
        label={renderLabel}
        labelLine={false}
      >
        {data.map((entry, idx) => (
          <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </RePieChart>
  );
}
